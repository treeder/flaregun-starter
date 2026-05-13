import { LitElement, html, css } from 'lit'
import 'material/text/text-field.js'
import 'material/buttons/button.js'
import { styles } from '/css/styles.js'
import { api } from 'api'

export class ProductForm extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
      }
    `,
  ]

  static properties = {
    product: { type: Object },
  }

  constructor() {
    super()
    this.product = {}
  }

  render() {
    return html`
      <md-card class="p16 w100 mb24" style="box-sizing: border-box;">
        <form id="product-form" class="w100">
          <div class="flex col g16">
            <md-text-field id="name" label="Name" value="${this.product.name}" required></md-text-field>
            <md-text-field id="description" label="Description" value="${this.product.description}"></md-text-field>
            <md-text-field
              id="price"
              label="Price"
              value="${this.product.price}"
              required
              type="number"
              placeholder="1.0"
              step="0.01"
              min="1"
              max="1000000"></md-text-field>
            <md-button type="button" @click=${this.submit} style="margin-top: 16px;">Save</md-button>
          </div>
        </form>
      </md-card>
    `
  }

  async submit() {
    let f = this.renderRoot.getElementById('product-form')
    if (!f.reportValidity()) return
    this.product = {
      name: this.renderRoot.getElementById('name').value,
      description: this.renderRoot.getElementById('description').value,
      price: this.renderRoot.getElementById('price').value,
    }
    console.log('submitting product', this.product)
    let r = await api('/v1/products', {
      method: 'POST',
      body: {
        product: this.product,
      },
    })
    this.product = r.product
    window.location.href = `/`
  }
}

customElements.define('product-form', ProductForm)
