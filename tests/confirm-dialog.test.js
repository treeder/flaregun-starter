import { test, expect } from 'vitest'

test('confirm-dialog component is served and structured properly', async () => {
  const res = await fetch('http://localhost:8787/components/confirm-dialog.js')
  expect(res.status).toBe(200)
  const code = await res.text()

  expect(code).toContain("customElements.define('confirm-dialog', ConfirmDialog)")
  expect(code).toContain("import 'material/dialog/dialog.js'")
  expect(code).toContain("import 'material/buttons/button.js'")
  expect(code).toContain("import 'material/icon/icon.js'")
  expect(code).toContain('<md-dialog')
  expect(code).toContain('@close=${this._handleClose}')
  expect(code).toContain('@cancel=${this._handleCancel}')
  expect(code).toContain('confirm(options = {})')
  expect(code).toContain('static async confirm(options = {})')
})

test('product-list component uses confirm-dialog for delete confirmation', async () => {
  const res = await fetch('http://localhost:8787/components/product-list.js')
  expect(res.status).toBe(200)
  const code = await res.text()

  expect(code).toContain("import '/components/confirm-dialog.js'")
  expect(code).toContain('<confirm-dialog id="confirmDialog"></confirm-dialog>')
  expect(code).toContain('dialog.confirm(')
  expect(code).not.toContain("if (confirm('Are you sure")
})

test('index page includes confirm-dialog component script', async () => {
  const res = await fetch('http://localhost:8787/')
  expect(res.status).toBe(200)
  const html = await res.text()

  expect(html).toContain('/components/confirm-dialog.js')
  expect(html).toContain('product-list')
})
