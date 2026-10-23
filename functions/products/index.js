import { html, stringifyAttribute } from 'rend'

export async function onRequestGet(c) {
  return await c.data.rend.html({
    title: 'Products',
    main: render,
  })
}

function render(d) {
  const userAttr = stringifyAttribute(d.user)

  return html`
    <script type="module">
      import '/components/product-list.js'
      import '/components/product-form.js'
      import '/components/confirm-dialog.js'
      import 'material/buttons/button.js'
      import 'material/icon/icon.js'
    </script>

    <div class="flex col g20 p16" style="max-width: 1120px; margin: 0 auto;">
      <div class="flex jcsb aic flexw g12">
        <div class="flex col g4">
          <div class="headline-medium" style="font-weight: 600;">Products Catalog</div>
          <div class="text-muted">
            ${d.user
              ? 'Create, edit, and manage products in your catalog.'
              : 'Browse all products. Sign in to create, edit, or delete items.'}
          </div>
        </div>
      </div>

      <product-list
        user="${userAttr}"
        ${d.user ? 'can-manage' : ''}></product-list>
    </div>
  `
}
