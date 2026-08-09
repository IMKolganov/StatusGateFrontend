import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        provider: 'v8',
        reporter: ['text', 'text-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/api/generated/**',
          'src/test/**',
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          'src/**/*.d.ts',
        ],
      },
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
