import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './tests/globalSetup.js',
    testTimeout: 15000,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
})
