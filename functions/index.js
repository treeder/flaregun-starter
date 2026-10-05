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
      import '/components/confirm-dialog.js'
      import 'material/buttons/button.js'
      import 'material/buttons/icon-button.js'
      import 'material/icon/icon.js'
    </script>

    <div class="flex col g20 p16">
      <div class="display-medium tac mt20 pb20">Hello World!</div>

      <div class="flex jcsb aic p16 flexw g12" style="background: var(--md-sys-color-surface-container, #f3edf7); border-radius: 16px; border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);">
        <div class="flex col g4">
          <div style="font-weight: 600; font-size: 1.1rem;">Material 3 Web Components Demo</div>
          <div class="text-muted small">Explore the full interactive showcase of Material 3 buttons, inputs, selects, tabs, dialogs, sliders, and feedback components.</div>
        </div>
        <a href="/demo">
          <md-button color="filled">
            <md-icon slot="icon">widgets</md-icon>
            View Components Showcase
          </md-button>
        </a>
      </div>

      <div class="flexr w100 g20" style="align-items: start;">
        <div class="flex col g16" style="flex: 1;">
          <div class="headline-medium">Product Form</div>
          <product-form></product-form>
        </div>
        <div class="flex col g16" style="flex: 2;">
          <div class="headline-medium">Products</div>
          <product-list></product-list>
        </div>
      </div>
    </div>
  `
}
