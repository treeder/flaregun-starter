import { LitElement, html, css } from 'lit'
import 'material/buttons/button.js'
import 'material/buttons/icon-button.js'
import 'material/icon/icon.js'
import 'material/card/card.js'
import { styles } from '/css/styles.js'
import { api } from 'api'

export class ProductList extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
      }
    `,
  ]

  static properties = {
    products: { type: Array },
  }

  constructor() {
    super()
    this.products = []
  }

  connectedCallback() {
    super.connectedCallback()
    this.fetchData()
  }

  async fetchData() {
    let r = await api('/v1/products')
    this.products = r.products
  }

  render() {
    return html`
      <md-card class="p16">
        <div class="grid g12 w100 jcc aic" style="grid-template-columns: repeat(5, 1fr);">
          ${this.products.map(
            (p) => html`
              <div><a href="/products/${p.id}">${p.name}</a></div>
              <div>${p.description}</div>
              <div>${p.price}</div>
              <div>${p.data?.x}</div>
              <md-icon-button @click=${() => this.deleteProduct(p.id)}><md-icon>delete</md-icon></md-icon-button>
            `,
          )}
        </div>
      </md-card>
    `
  }

  async deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
      const response = await fetch(`/v1/products/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        location.reload()
      } else {
        console.error('Failed to delete product')
        alert('Failed to delete product.')
      }
    }
  }
}

customElements.define('product-list', ProductList)
