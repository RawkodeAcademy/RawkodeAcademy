/** Payload collections whose document primary keys must be CUID2 text values. */
export const cuid2DocumentTables = [
  'videos', 'shows', 'episodes', 'articles', 'news', 'series', 'courses', 'course_modules', 'learning_paths',
  'technologies', 'people', 'testimonials', 'users', 'media', 'seasons', 'brackets', 'matches', 'match_results',
  'competitors', 'teams', 'bracket_applications', 'team_members', 'bracket_entries', 'bracket_breaks', 'registrations',
  'changelog', 'adrs', 'pipeline_runs', 'deletion_markers', 'static_assets', 'video_review_grants',
  'review_revision_grants', 'video_publications', 'team_invites', 'video_revisions', 'review_comments',
  'review_decisions', 'chapters', 'learning_resources',
] as const

const cuid2DocumentTableSet = new Set<string>(cuid2DocumentTables)
/** Full fresh-chain history required before a nonempty D1 can be reused. */
export const cuid2MigrationNames = [
  'cuid2_20261004_153744',
  'cuid2_20261004_154006',
  'cuid2_20261004_154154',
  'cuid2_20261004_154336',
  'cuid2_20261004_161607_oidc',
  'cuid2_20261004_201756',
  'cuid2_20261004_202555',
  'cuid2_20261004_204039',
  'cuid2_20261004_204407',
  'cuid2_20261004_210158',
  'cuid2_20261005_120000_video_review',
  'cuid2_20261005_180000_review_intake',
  'cuid2_20261005_200000_review_jobs',
  'cuid2_20261007_140000_review_thumbnails',
  'cuid2_20261009_130000_review_revision_grants',
  'cuid2_20261010_160000_content_schema_cleanup',
] as const
const cuid2MigrationNameSet = new Set<string>(cuid2MigrationNames)
type TableInfo = { name: string; type: string }
type ForeignKeyInfo = { from: string; table: string }

/**
 * Refuse to serve against the old integer-ID schema. Production cutover needs
 * an explicit data migration/reseed; silently writing CUID2 values into the old
 * adapter schema would make admin, auth and relationship reads inconsistent.
 */
export async function assertCuid2DocumentSchema(db: D1Database): Promise<void> {
  // D1 round trips dominate cold Payload initialization. Read all required
  // document IDs through SQLite's table-valued PRAGMA in one query.
  const requiredTables = cuid2DocumentTables.map(name => `('${name}')`).join(', ')
  const ids = await db.prepare(`
    WITH required(table_name) AS (VALUES ${requiredTables})
    SELECT required.table_name AS table_name, lower(column_info.type) AS id_type
    FROM required
    LEFT JOIN pragma_table_info(required.table_name) AS column_info
      ON column_info.name = 'id'
    ORDER BY required.table_name
  `).all<{ table_name: string; id_type: string | null }>()

  for (const { table_name, id_type } of ids.results) {
    if (!id_type) throw new Error(`CUID2 schema guard: missing ${table_name}.id; apply the isolated CUID2 migration chain first`)
    if (id_type !== 'text') throw new Error(`CUID2 schema guard: ${table_name}.id is ${id_type || 'untyped'}, expected TEXT; use the documented data cutover before deploying`)
  }

  // Check every foreign-key column that targets a CUID2 document table in a
  // single query instead of issuing PRAGMA calls once per table.
  const references = await db.prepare(`
    WITH required(table_name) AS (VALUES ${requiredTables})
    SELECT tables.name AS table_name,
      foreign_keys."from" AS source_column,
      foreign_keys."table" AS referenced_table,
      lower(column_info.type) AS source_type
    FROM sqlite_master AS tables
    JOIN pragma_foreign_key_list(tables.name) AS foreign_keys ON 1 = 1
    JOIN pragma_table_info(tables.name) AS column_info
      ON column_info.name = foreign_keys."from"
    WHERE tables.type = 'table'
      AND foreign_keys."table" IN (SELECT table_name FROM required)
  `).all<{
    table_name: string
    source_column: string
    referenced_table: string
    source_type: string
  }>()

  for (const { table_name, source_column, referenced_table, source_type } of references.results) {
    if (source_type !== 'text') throw new Error(`CUID2 schema guard: ${table_name}.${source_column} must be TEXT to reference ${referenced_table}.id`)
  }
}

type TableName = { name: string }
type MigrationName = { name: string }
type LegacyForeignKeyInfo = { from: string; table: string }

// These tables are Payload document collections whose existing IDs are
// adapter-generated integers. Review workflow records below remain opaque
// text IDs even before the new CUID2 content schema.
const legacyIntegerDocumentTables = new Set<string>([
  'videos', 'shows', 'episodes', 'articles', 'news', 'series', 'courses', 'course_modules', 'learning_paths',
  'technologies', 'people', 'testimonials', 'users', 'media', 'seasons', 'brackets', 'matches', 'match_results',
  'competitors', 'teams', 'bracket_applications', 'team_members', 'bracket_entries', 'bracket_breaks',
  'registrations', 'changelog', 'adrs', 'pipeline_runs', 'deletion_markers', 'static_assets', 'team_invites',
  'chapters', 'learning_resources',
])
const legacyNumericDocumentTables = new Set<string>(['video_publications'])

async function existingTables(db: D1Database): Promise<Set<string>> {
  const result = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all<TableName>()
  // A newly provisioned remote D1 already contains this reserved storage
  // table. Ignore only that exact platform table, never application tables
  // or migration history (including an interrupted migration).
  return new Set(result.results.map(({ name }) => name).filter(name => name !== '_cf_KV'))
}

async function recordedMigrationNames(db: D1Database, tables: Set<string>): Promise<string[]> {
  if (!tables.has('payload_migrations')) return []
  const result = await db.prepare('SELECT name FROM payload_migrations').all<MigrationName>()
  return result.results.map(({ name }) => name)
}

/**
 * Before the CUID2 chain writes anything, accept only an empty D1 or a D1 with
 * the complete registered CUID2 chain (for an idempotent PR deployment
 * retry). A legacy, partial, or unrelated database must be reseeded instead of
 * converted by accident.
 */
export async function assertCuid2MigrationTarget(db: D1Database, options: { allowEmpty?: boolean } = {}): Promise<void> {
  const tables = await existingTables(db)
  if (tables.size === 0) {
    if (options.allowEmpty !== false) return
    throw new Error('CUID2 migration target guard: production must already contain the verified, reimported CUID2 database; refusing an empty D1.')
  }

  const names = await recordedMigrationNames(db, tables)
  const recorded = new Set(names)
  const missing = cuid2MigrationNames.filter(name => !recorded.has(name))
  const unexpected = names.filter(name => !cuid2MigrationNameSet.has(name))
  if (missing.length > 0 || unexpected.length > 0 || names.length !== cuid2MigrationNames.length) {
    const missingDescription = missing.length ? `missing ${missing.join(', ')}` : 'no required migrations missing'
    const unexpectedDescription = unexpected.length ? `unexpected ${unexpected.join(', ')}` : 'no unexpected migrations'
    throw new Error(`CUID2 migration target guard: incomplete CUID2 migration chain (${missingDescription}; ${unexpectedDescription}; tables ${[...tables].sort().join(', ')}); use a fresh isolated D1.`)
  }
  await assertCuid2DocumentSchema(db)
}

/**
 * Production/shared Preview still use their historical integer schema during
 * this PR. Never let the fresh CUID2 chain or an empty target masquerade as a
 * legacy migration target.
 */
export async function assertLegacyMigrationTarget(db: D1Database): Promise<void> {
  const tables = await existingTables(db)
  if (!tables.has('videos') || !tables.has('users') || !tables.has('payload_migrations')) {
    throw new Error('Legacy migration target guard: expected the existing integer-ID Payload schema; refusing an empty or incomplete D1.')
  }

  const names = await recordedMigrationNames(db, tables)
  if (names.some(name => name.startsWith('cuid2_'))) {
    throw new Error('Legacy migration target guard: this D1 already records the isolated CUID2 chain.')
  }

  for (const table of [...legacyIntegerDocumentTables, ...legacyNumericDocumentTables]) {
    if (!tables.has(table)) continue
    const columns = await db.prepare(`PRAGMA table_info("${table}")`).all<TableInfo>()
    const id = columns.results.find(column => column.name === 'id')
    const actualType = id?.type.toLowerCase()
    const expectedType = legacyNumericDocumentTables.has(table) ? 'numeric' : 'integer'
    if (!id || actualType !== expectedType) {
      throw new Error(`Legacy migration target guard: ${table}.id is ${id?.type || 'missing'}, expected ${expectedType.toUpperCase()}; production cutover must run separately.`)
    }
  }

  for (const table of tables) {
    if (!/^[a-z_][a-z0-9_]*$/.test(table)) continue
    const [columns, foreignKeys] = await Promise.all([
      db.prepare(`PRAGMA table_info("${table}")`).all<TableInfo>(),
      db.prepare(`PRAGMA foreign_key_list("${table}")`).all<LegacyForeignKeyInfo>(),
    ])
    const types = new Map(columns.results.map(column => [column.name, column.type.toLowerCase()]))
    for (const foreignKey of foreignKeys.results) {
      const expectedType = legacyIntegerDocumentTables.has(foreignKey.table)
        ? 'integer'
        : legacyNumericDocumentTables.has(foreignKey.table) ? 'numeric' : undefined
      if (expectedType && types.get(foreignKey.from) !== expectedType) {
        throw new Error(`Legacy migration target guard: ${table}.${foreignKey.from} must be ${expectedType.toUpperCase()} to reference ${foreignKey.table}.id.`)
      }
    }
  }
}

export async function assertMigrationTarget(db: D1Database, chain: 'legacy' | 'cuid2', options: { allowEmpty?: boolean } = {}): Promise<void> {
  if (chain === 'cuid2') return assertCuid2MigrationTarget(db, options)
  return assertLegacyMigrationTarget(db)
}
