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
      import 'material/buttons/icon-button.js'
      import 'material/icon/icon.js'
    </script>
    <script>
      async function deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
          const response = await fetch(\`/v1/products/\${id}\`, {
            method: 'DELETE',
          });
          if (response.ok) {
            location.reload();
          } else {
            console.error('Failed to delete product');
            alert('Failed to delete product.');
          }
        }
      }
    </script>

    <div class="flex col g20">
      <div>Hello World!</div>
      <div>
        <product-form></product-form>
      </div>
      <div>
        <div class="headline-medium">Products</div>
      </div>
      <div class="grid g12 w100 jcc aic" style="grid-template-columns: repeat(5, 1fr);">
        ${d.products.map(
          (p) => html`
            <div>${p.name}</div>
            <div>${p.description}</div>
            <div>${p.price}</div>
            <div>${p.data?.x}</div>
            <md-icon-button onclick="deleteProduct('${p.id}')"><md-icon>delete</md-icon></md-icon-button>
          `,
        )}
      </div>
    </div>
  `
}
