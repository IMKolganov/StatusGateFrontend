import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          test: {
            name: 'unit',
            environment: 'node',
            include: ['src/**/*.test.ts'],
            setupFiles: ['./src/test/setup.ts'],
          },
        },
        {
          test: {
            name: 'components',
            environment: 'jsdom',
            include: ['src/**/*.test.tsx'],
            setupFiles: ['./src/test/setup.ts'],
          },
        },
      ],
    },
  }),
)
