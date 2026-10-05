import { test, expect } from 'vitest'
import { baseUrl } from './helper.js'

test('demo page route /demo is served and renders material-demo component', async () => {
  const res = await fetch(`${baseUrl}/demo`)
  expect(res.status).toBe(200)
  const html = await res.text()

  expect(html).toContain('Material 3 Demo')
  expect(html).toContain('/components/material-demo.js')
  expect(html).toContain('<material-demo></material-demo>')
})

test('material-demo component is served and imports Material 3 components', async () => {
  const res = await fetch(`${baseUrl}/components/material-demo.js`)
  expect(res.status).toBe(200)
  const code = await res.text()

  expect(code).toContain("customElements.define('material-demo', MaterialDemo)")
  expect(code).toContain("import 'material/buttons/button.js'")
  expect(code).toContain("import 'material/buttons/button-group.js'")
  expect(code).toContain("import 'material/buttons/split-button.js'")
  expect(code).toContain("import 'material/buttons/fab.js'")
  expect(code).toContain("import 'material/select/select.js'")
  expect(code).toContain("import 'material/switch/switch.js'")
  expect(code).toContain("import 'material/checkbox/checkbox.js'")
  expect(code).toContain("import 'material/slider/slider.js'")
  expect(code).toContain("import 'material/tabs/tabs.js'")
  expect(code).toContain("import 'material/chips/chip-set.js'")
  expect(code).toContain("import 'material/dialog/dialog.js'")
  expect(code).toContain("import 'material/tooltip/tooltip.js'")
  expect(code).toContain("import 'material/indicators/loading.js'")
  expect(code).toContain("import 'material/indicators/progress.js'")
  expect(code).toContain("import 'material/carousel/carousel.js'")
  expect(code).toContain("import 'material/search/search.js'")
  expect(code).toContain("import 'material/list/list.js'")
})

test('product-form component uses Material select, switch, slider, and snackbar', async () => {
  const res = await fetch(`${baseUrl}/components/product-form.js`)
  expect(res.status).toBe(200)
  const code = await res.text()

  expect(code).toContain("import 'material/select/select.js'")
  expect(code).toContain("import 'material/switch/switch.js'")
  expect(code).toContain("import 'material/slider/slider.js'")
  expect(code).toContain("import { snack } from 'material/snackbar/snackbar.js'")
  expect(code).toContain('<md-select')
  expect(code).toContain('<md-switch')
  expect(code).toContain('<md-slider')
})

test('product-list component uses Material search, chip-set, badges, and tooltips', async () => {
  const res = await fetch(`${baseUrl}/components/product-list.js`)
  expect(res.status).toBe(200)
  const code = await res.text()

  expect(code).toContain("import 'material/search/search.js'")
  expect(code).toContain("import 'material/chips/chip-set.js'")
  expect(code).toContain("import 'material/tooltip/tooltip.js'")
  expect(code).toContain('<md-search')
  expect(code).toContain('<md-chip-set')
  expect(code).toContain('<md-tooltip')
})

test('layout navbar includes navigation links for Products and Components Demo', async () => {
  const res = await fetch(`${baseUrl}/`)
  expect(res.status).toBe(200)
  const html = await res.text()

  expect(html).toContain('Products')
  expect(html).toContain('Components Demo')
  expect(html).toContain('href="/demo"')
})
