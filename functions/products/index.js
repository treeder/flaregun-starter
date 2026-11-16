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
          <h1 class="headline-medium" style="margin: 0; font-weight: 600;">Products Catalog</h1>
          <div class="text-muted">
            ${
              d.user
                ? 'Shop the shared marketplace, upload product photos to R2, or manage your own listings.'
                : 'Browse community and official products, add items to your cart, or sign in to list your own.'
            }
          </div>
        </div>
      </div>

      <product-list user="${userAttr}" ${d.user ? 'can-manage' : ''}></product-list>
    </div>
  `
}
