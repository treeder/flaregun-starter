import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './tests/globalSetup.js',
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
})
