import { html } from 'rend'
import { Product } from '../../data/products.js'

export async function onRequestGet(c) {
  let product = await c.data.d1.get(Product, c.params.id)
  return await c.data.rend.html({
    main: render,
    product,
  })
}

function render(d) {
  return html`
    <script type="module">
      import '/components/product-form.js'
      import '/components/product-list.js'
      import 'material/buttons/icon-button.js'
      import 'material/icon/icon.js'
    </script>

    <div class="flex col g20">
      <div class="headline-medium">${d.product.name}</div>
    </div>
  `
}
