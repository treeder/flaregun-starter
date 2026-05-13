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
      <div class="flex col g16 w100">
        ${this.products.map(
          (p) => html`
            <md-card class="p16 flex col w100 g12" style="box-sizing: border-box;">
              <div class="flex col g8">
                <div class="flex aic jcsb">
                  <div class="headline-medium"><a href="/products/${p.id}">${p.name}</a></div>
                  <md-icon-button class="error" @click=${() => this.deleteProduct(p.id)}>
                    <md-icon>delete</md-icon>
                  </md-icon-button>
                </div>
                <div style="color: var(--md-sys-color-on-surface-variant);">${p.description}</div>
                <div style="font-weight: bold; font-size: 1.2rem; color: var(--md-sys-color-primary);">$${p.price}</div>
                ${p.data?.x ? html`<div>${p.data.x}</div>` : ''}
              </div>
            </md-card>
          `,
        )}
      </div>
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
