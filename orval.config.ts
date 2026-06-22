import { defineConfig } from 'orval'

const openApiTarget = process.env.OPENAPI_URL ?? './openapi.json'

export default defineConfig({
  statusgate: {
    input: {
      target: openApiTarget,
      override: {
        transformer: './src/api/openapi-transformer.ts',
      },
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated',
      schemas: './src/api/generated/models',
      client: 'fetch',
      clean: true,
      override: {
        mutator: {
          path: './src/api/mutator.ts',
          name: 'customFetch',
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
  },
})
