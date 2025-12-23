import { html } from 'rend'
import { getProducts, Product } from './data/products.js'

export async function onRequestGet(c) {
  return await c.data.rend.html({
    main: render,
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
      <div>Hello World!</div>
      <div>
        <div class="headline-medium">Product Form</div>
      </div>
      <div>
        <product-form></product-form>
      </div>
      <div>
        <div class="headline-medium">Products</div>
      </div>
      <div>
        <product-list></product-list>
      </div>
    </div>
  `
}
