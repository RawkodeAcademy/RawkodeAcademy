import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://api.rawkode.academy/graphql',
  documents: [
    'src/**/*.{ts,tsx,astro}',
    'astro.config.mts'
  ],
  generates: {
    'src/lib/graphql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: { enable: false }
      },
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        constEnums: true,
        skipTypename: true,
        scalars: {
          DateTime: 'string',
          JSON: 'Record<string, any>'
        }
      }
    },
    'src/lib/graphql/introspection.json': {
      plugins: ['introspection']
    }
  },
  ignoreNoDocuments: true,
  hooks: {
    afterAllFileWrite: ['biome format --write']
  }
};

export default config;