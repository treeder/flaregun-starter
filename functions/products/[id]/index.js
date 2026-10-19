import { html } from 'rend'
import { Product } from '../../data/products.js'

export async function onRequestGet(c) {
  let product = await c.data.d1.get(Product, c.params.id)
  return await c.data.rend.html({
    title: product ? product.name : 'Product Not Found',
    main: render,
    product,
  })
}

function render(d) {
  const productAttr = d.product ? JSON.stringify(d.product).replace(/"/g, '&quot;') : ''
  const userAttr = d.user ? JSON.stringify(d.user).replace(/"/g, '&quot;') : ''

  return html`
    <script type="module">
      import '/components/product-detail.js'
    </script>

    <div class="flex col g20 p16" style="max-width: 960px; margin: 0 auto;">
      <product-detail
        product="${productAttr}"
        user="${userAttr}"
        ${d.user ? 'can-manage' : ''}></product-detail>
    </div>
  `
}
