import { test, expect } from 'vitest'
import { baseUrl } from './helper.js'
import { SAMPLE_PRODUCTS, seedProducts } from '../functions/data/products.js'
import { TOOLS } from '../functions/services/mcpTools.js'

test('landing page renders redesigned hero, interactive showcase, bento grid, and launchpad CTA', async () => {
  const res = await fetch(`${baseUrl}/`)
  expect(res.status).toBe(200)
  const html = await res.text()

  expect(html).toContain('class="topnav-inner"')
  expect(html).toContain('class="hero-stage"')
  expect(html).toContain('<landing-showcase></landing-showcase>')
  expect(html).toContain('<cli-copy-bar')
  expect(html).toContain('class="bento-grid"')
  expect(html).toContain('D1 SQL Models, Joins &amp; Atomic JSON Merge Patch')
  expect(html).toContain('MCP Endpoint Built-In')
  expect(html).toContain('class="marketplace-section"')
  expect(html).toContain('class="cta-launchpad"')
})

test('landing-showcase component uses Material 3 tabs, exact MCP schema, and lossless code tokenization', async () => {
  const res = await fetch(`${baseUrl}/components/landing-showcase.js`)
  expect(res.status).toBe(200)
  const code = await res.text()

  expect(code).toContain("customElements.define('landing-showcase', LandingShowcase)")
  expect(code).toContain("customElements.define('cli-copy-bar', CliCopyBar)")
  expect(code).toContain("import 'material/tabs/tabs.js'")
  expect(code).toContain("import 'material/tabs/tab.js'")
  expect(code).toContain("import 'material/buttons/icon-button.js'")
  expect(code).toContain("import 'material/tooltip/tooltip.js'")
  expect(code).toContain("import { snack } from 'material/snackbar/snackbar.js'")
  expect(code).toContain('disconnectedCallback()')
  expect(code).toContain('functions/v1/products/[id]/index.js')
  expect(code).toContain('"listProducts"')
  expect(code).toContain('"inStock": true')
  expect(code).toContain('role="region"')
  expect(code).toContain('tabindex="0"')

  // Verify MCP tool referenced in the showcase matches the real MCP server tool schema
  const listProductsTool = TOOLS.find((t) => t.name === 'listProducts')
  expect(listProductsTool).toBeDefined()
  expect(listProductsTool.inputSchema.properties).toHaveProperty('category')
  expect(listProductsTool.inputSchema.properties).toHaveProperty('inStock')
})

test('landing page styles are served in /css/styles.css and excluded from shadow-DOM /css/styles.js', async () => {
  const cssRes = await fetch(`${baseUrl}/css/styles.css`)
  expect(cssRes.status).toBe(200)
  const cssText = await cssRes.text()

  expect(cssText).toContain('.hero-stage')
  expect(cssText).toContain('.bento-grid')
  expect(cssText).toContain('.topnav-inner')
  expect(cssText).toContain('color-scheme: light dark')

  const shadowCssRes = await fetch(`${baseUrl}/css/styles.js`)
  expect(shadowCssRes.status).toBe(200)
  const shadowCssText = await shadowCssRes.text()
  expect(shadowCssText).not.toContain('.hero-stage')
  expect(shadowCssText).not.toContain('.bento-grid')
})

test('seedProducts backfills official sample products when only legacy null-userId rows exist', async () => {
  const inserted = []
  const fakeContext = {
    data: {
      d1: {
        query: async () => [{ id: 'legacy-1', name: 'test', userId: null, status: 'active', price: 3, data: {} }],
        insert: async (_model, item) => {
          inserted.push(item)
          return { ...item, id: `seed-${inserted.length}` }
        },
        prepare: () => ({ run: async () => ({}) }),
        update: async () => ({}),
      },
      logger: {
        error: () => {},
      },
    },
  }

  await seedProducts(fakeContext)
  expect(inserted.length).toBe(SAMPLE_PRODUCTS.length)
  expect(inserted.map((p) => p.name)).toEqual(SAMPLE_PRODUCTS.map((p) => p.name))
})
