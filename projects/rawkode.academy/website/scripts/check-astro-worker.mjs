import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

// Vite can emit the entrypoint as a small re-export of a hashed implementation
// chunk. Inspect reachable modules, never unrelated files left in the output.
export async function checkAstroWorker(configPath) {
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  if (typeof config.compatibility_date !== 'string' || config.compatibility_date < '2025-11-17' || config.compatibility_flags?.includes('disable_ctx_exports')) {
    throw new Error('The generated Astro Wrangler config must enable ctx.exports through its compatibility date.')
  }
  if (config.exports?.default?.type !== 'worker' || config.exports.default.cache?.enabled !== false || config.exports?.CachedAstro?.type !== 'worker') {
    throw new Error('The generated Astro Wrangler config must preserve the uncached default gateway and named CachedAstro export.')
  }
  if (typeof config.main !== 'string' || !config.main.trim() || config.main === '@astrojs/cloudflare/entrypoints/server') {
    throw new Error('The generated Astro Wrangler config must point at the custom Astro Worker entrypoint.')
  }
  const entrypoint = path.resolve(path.dirname(configPath), config.main)
  const pending = [entrypoint]
  const visited = new Set()
  let exportsCachedAstro = false
  let hasCacheFlag = false
  while (pending.length) {
    const filename = pending.pop()
    if (visited.has(filename)) continue
    visited.add(filename)
    const source = await readFile(filename, 'utf8')
    const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
    if (ast.parseDiagnostics.length) throw new Error(`Invalid generated Worker module: ${filename}`)
    const visit = node => {
      if (ts.isIdentifier(node) && node.text === 'PUBLIC_SSR_CACHE_ENABLED') hasCacheFlag = true
      ts.forEachChild(node, visit)
    }
    visit(ast)
    for (const statement of ast.statements) {
      if (filename === entrypoint) {
        if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
          exportsCachedAstro ||= statement.exportClause.elements.some(element => element.name.text === 'CachedAstro')
        }
        if (ts.isClassDeclaration(statement) && statement.name?.text === 'CachedAstro' && statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
          exportsCachedAstro = true
        }
      }
      if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
        const specifier = statement.moduleSpecifier.text
        if (specifier.startsWith('.')) pending.push(path.resolve(path.dirname(filename), specifier))
      }
    }
  }
  if (!exportsCachedAstro || !hasCacheFlag) {
    throw new Error(`The generated Wrangler main ${config.main} and its module graph do not contain the custom CachedAstro WorkerEntrypoint and cache gateway.`)
  }
  return { config, modules: visited.size }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await checkAstroWorker(path.resolve(process.argv[2] ?? 'dist/server/wrangler.json'))
  console.log(`Astro Worker entrypoint and cache gateway verified across ${result.modules} generated modules.`)
}
