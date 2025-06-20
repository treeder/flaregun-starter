import { html } from "rend"

export async function onRequestGet(c) {
  let products = await c.data.d1.query("products")
  return await c.data.rend.html({
    main: render,
    products,
  })
}

function render(d) {
  return html`
  <script type="module">
  import "/components/product-form.js"
  </script>

  <div class="flex col g20">
    <div>
      Hello World!
    </div>
    <div>
      <product-form></product-form>
    </div>
    <div>
      <div class="headline-medium">Products</div>
    </div>
    <div class="flex col g12">
      ${d.products.map(p => html`
        <div class="flex g12">
        <div>${p.name}</div><div>${p.description}</div><div>${p.price}</div>
        </div>`)}
    </div>
  </div>
  `
}