import { html, stringifyAttribute } from 'rend'
import { getProduct } from '../../data/products.js'

export async function onRequestGet(c) {
  let product = await getProduct(c, c.params.id)
  const canManage = Boolean(c.data.user && product && product.userId === c.data.user.id)
  return await c.data.rend.html({
    title: product ? product.name : 'Product Not Found',
    main: render,
    product,
    canManage,
  })
}

function render(d) {
  const productAttr = stringifyAttribute(d.product)
  const userAttr = stringifyAttribute(d.user)

  return html`
    <script type="module">
      import '/components/product-detail.js'
    </script>

    <div class="flex col g20 p16" style="max-width: 960px; margin: 0 auto;">
      <product-detail
        product="${productAttr}"
        user="${userAttr}"
        ${d.canManage ? 'can-manage' : ''}></product-detail>
    </div>
  `
}
