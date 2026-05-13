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

    <div class="flex col g20 p16">
      <div class="display-medium" style="text-align: center; margin: 40px 0;">Hello World!</div>
      <div class="grid w100 g20" style="grid-template-columns: 1fr 2fr; align-items: start;">
        <div class="flex col g16">
          <div class="headline-medium">Product Form</div>
          <product-form></product-form>
        </div>
        <div class="flex col g16">
          <div class="headline-medium">Products</div>
          <product-list></product-list>
        </div>
      </div>
    </div>
  `
}
