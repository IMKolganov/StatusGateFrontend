import { defineConfig } from 'orval'

const openApiUrl = process.env.OPENAPI_URL ?? 'http://localhost:8000/openapi.json'

export default defineConfig({
  statusgate: {
    input: {
      target: openApiUrl,
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
      },
    },
  },
})
