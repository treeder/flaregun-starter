import { LitElement, html, css } from 'lit'
import 'material/text/text-field.js'
import 'material/select/select.js'
import 'material/select/select-option.js'
import 'material/switch/switch.js'
import 'material/slider/slider.js'
import 'material/buttons/button.js'
import 'material/card/card.js'
import 'material/icon/icon.js'
import 'material/indicators/progress.js'
import { snack } from 'material/snackbar/snackbar.js'
import { styles } from '/css/styles.js'
import { api } from 'api'

export class ProductForm extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
      }
      .form-section-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }
      .field-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: var(--md-sys-color-surface-container, rgba(0, 0, 0, 0.02));
        border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
        border-radius: 8px;
      }
    `,
  ]

  static properties = {
    product: { type: Object },
    submitting: { type: Boolean },
    discount: { type: Number },
    embedded: { type: Boolean },
    showCancel: { type: Boolean, attribute: 'show-cancel' },
  }

  constructor() {
    super()
    this.product = {}
    this.submitting = false
    this.discount = 0
    this.embedded = false
    this.showCancel = false
  }

  updated(changedProperties) {
    if (changedProperties.has('product')) {
      const p = this.getProductObj()
      this.discount = Number(p.data?.discount) || 0
      this.syncFields(p)
    }
  }

  getProductObj() {
    if (typeof this.product === 'string') {
      try {
        return JSON.parse(this.product)
      } catch (e) {
        return {}
      }
    }
    return this.product || {}
  }

  syncFields(p = this.getProductObj()) {
    const nameEl = this.renderRoot?.getElementById('name')
    if (nameEl) nameEl.value = p.name || ''
    const descEl = this.renderRoot?.getElementById('description')
    if (descEl) descEl.value = p.description || ''
    const priceEl = this.renderRoot?.getElementById('price')
    if (priceEl) priceEl.value = p.price !== undefined && p.price !== null ? String(p.price) : ''
    const catEl = this.renderRoot?.getElementById('category')
    if (catEl) catEl.value = p.data?.category || 'electronics'
    const inStockEl = this.renderRoot?.getElementById('inStock')
    if (inStockEl) inStockEl.selected = p.data?.inStock !== false
    const discountEl = this.renderRoot?.getElementById('discount')
    if (discountEl) discountEl.value = Number(p.data?.discount) || 0
  }

  resetForm() {
    this.product = {}
    this.discount = 0
    const f = this.renderRoot?.getElementById('product-form')
    if (f) f.reset()
    this.syncFields({})
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }))
  }

  renderFormContent() {
    const p = this.getProductObj()
    const isEditing = Boolean(p.id)

    return html`
      <form
        id="product-form"
        class="w100"
        @submit=${(e) => {
          e.preventDefault()
          this.submit()
        }}>
        <div class="flex col g16">
          <md-text-field
            id="name"
            label="Name"
            value="${p.name || ''}"
            required
            minlength="2"
            placeholder="e.g. Wireless Headphones"></md-text-field>

          <md-select id="category" label="Category" required>
            <md-select-option
              value="electronics"
              ?selected=${!p.data?.category || p.data?.category === 'electronics'}>
              <div slot="headline">Electronics</div>
            </md-select-option>
            <md-select-option value="apparel" ?selected=${p.data?.category === 'apparel'}>
              <div slot="headline">Apparel</div>
            </md-select-option>
            <md-select-option value="books" ?selected=${p.data?.category === 'books'}>
              <div slot="headline">Books & Media</div>
            </md-select-option>
            <md-select-option value="home" ?selected=${p.data?.category === 'home'}>
              <div slot="headline">Home & Kitchen</div>
            </md-select-option>
            <md-select-option value="accessories" ?selected=${p.data?.category === 'accessories'}>
              <div slot="headline">Accessories</div>
            </md-select-option>
          </md-select>

          <md-text-field
            id="description"
            label="Description"
            value="${p.description || ''}"
            placeholder="Brief description of the product"></md-text-field>

          <md-text-field
            id="price"
            label="Price ($)"
            value="${p.price ?? ''}"
            required
            type="number"
            placeholder="1.0"
            step="0.01"
            min="0.01"
            max="1000000"></md-text-field>

          <div class="field-row">
            <div class="flex col g4">
              <span style="font-weight: 500;">In Stock</span>
              <span class="text-muted small">Show item as immediately available</span>
            </div>
            <md-switch id="inStock" ?selected=${p.data?.inStock !== false} icons></md-switch>
          </div>

          <div class="flex col g4">
            <div class="flex jcsb aic">
              <span style="font-weight: 500; font-size: 13px;">Discount</span>
              <span class="text-muted small">${this.discount}% off</span>
            </div>
            <md-slider
              id="discount"
              labeled
              min="0"
              max="75"
              step="5"
              value="${this.discount}"
              @change=${(e) => {
                this.discount = Number(e.target.value) || 0
              }}></md-slider>
          </div>

          ${this.submitting ? html`<md-progress type="linear" indeterminate shape="wavy"></md-progress>` : ''}

          <div class="flex jce g8 mt8">
            ${this.showCancel
              ? html`
                  <md-button type="button" color="text" @click=${this.handleCancel} ?disabled=${this.submitting}>
                    Cancel
                  </md-button>
                `
              : ''}
            <md-button type="button" color="filled" @click=${this.submit} ?disabled=${this.submitting}>
              <md-icon slot="icon">${isEditing ? 'check' : 'save'}</md-icon>
              ${this.submitting ? 'Saving...' : isEditing ? 'Update Product' : 'Save Product'}
            </md-button>
          </div>
        </div>
      </form>
    `
  }

  render() {
    if (this.embedded) {
      return this.renderFormContent()
    }
    return html`
      <md-card class="p16 w100 mb24" style="box-sizing: border-box;">
        ${this.renderFormContent()}
      </md-card>
    `
  }

  async submit() {
    let f = this.renderRoot.getElementById('product-form')
    if (!f.reportValidity()) return

    const current = this.getProductObj()
    const isEditing = Boolean(current.id)
    const categoryEl = this.renderRoot.getElementById('category')
    const inStockEl = this.renderRoot.getElementById('inStock')
    const discountEl = this.renderRoot.getElementById('discount')

    this.submitting = true
    try {
      const payload = {
        name: this.renderRoot.getElementById('name').value,
        description: this.renderRoot.getElementById('description').value,
        price: parseFloat(this.renderRoot.getElementById('price').value),
        data: {
          ...(current.data || {}),
          category: categoryEl ? categoryEl.value : current.data?.category || 'electronics',
          inStock: inStockEl ? inStockEl.selected : true,
          discount: discountEl ? Number(discountEl.value) : this.discount,
        },
      }

      let r
      if (isEditing) {
        r = await api(`/v1/products/${current.id}`, {
          method: 'PUT',
          body: {
            product: payload,
          },
        })
        snack('Product updated successfully!', { showCloseIcon: true })
      } else {
        r = await api('/v1/products', {
          method: 'POST',
          body: {
            product: payload,
          },
        })
        snack('Product saved successfully!', { showCloseIcon: true })
      }

      this.product = r.product

      // Dispatch events for in-page and dialog listeners
      window.dispatchEvent(new CustomEvent('product-saved', { detail: r.product }))
      this.dispatchEvent(new CustomEvent('saved', { detail: r.product, bubbles: true, composed: true }))

      if (!isEditing) {
        this.resetForm()
      }
    } catch (err) {
      console.error(err)
      snack(err.message || 'Failed to save product', { showCloseIcon: true })
    } finally {
      this.submitting = false
    }
  }
}

customElements.define('product-form', ProductForm)
