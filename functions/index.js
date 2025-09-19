import { html } from 'rend'
import { getProducts, Product } from './data/products.js'

export async function onRequestGet(c) {
  let products = await c.data.d1.query(Product)
  console.log(products)
  products = await getProducts(c, {})
  console.log('products2:', products)
  return await c.data.rend.html({
    main: render,
    products,
  })
}

function render(d) {
  return html`
    <script type="module">
      import '/components/product-form.js'
    </script>

    <div class="flex col g20">
      <div>Hello World!</div>
      <div>
        <product-form></product-form>
      </div>
      <div>
        <div class="headline-medium">Products</div>
      </div>
      <div class="grid g12 w100" style="grid-template-columns: repeat(4, 1fr);">
        ${d.products.map(
          (p) => html`
            <div>${p.name}</div>
            <div>${p.description}</div>
            <div>${p.price}</div>
            <div>${p.data?.x}</div>
          `,
        )}
      </div>
    </div>
  `
}
