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
      .field-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 12px;
        background: var(--md-sys-color-surface-container, rgba(0, 0, 0, 0.02));
        border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
        border-radius: 8px;
      }
      .image-dropzone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 16px;
        border-radius: 12px;
        border: 2px dashed var(--md-sys-color-outline-variant, #cac4d0);
        background: var(--md-sys-color-surface-container-low, rgba(0, 0, 0, 0.015));
        transition:
          border-color 0.15s ease,
          background-color 0.15s ease;
      }
      .image-dropzone.dragging {
        border-color: var(--md-sys-color-primary, #6750a4);
        background: var(--md-sys-color-secondary-container, rgba(103, 80, 164, 0.08));
      }
      .preview-img {
        inline-size: 100%;
        max-inline-size: 280px;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      }
      .two-col {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
    `,
  ]

  static properties = {
    product: { type: Object },
    submitting: { type: Boolean },
    uploadingImage: { type: Boolean },
    draggingImage: { type: Boolean },
    imageUrl: { type: String },
    discount: { type: Number },
    embedded: { type: Boolean },
    showCancel: { type: Boolean, attribute: 'show-cancel' },
  }

  constructor() {
    super()
    this.product = {}
    this.submitting = false
    this.uploadingImage = false
    this.draggingImage = false
    this.imageUrl = ''
    this.discount = 0
    this.embedded = false
    this.showCancel = false
  }

  updated(changedProperties) {
    if (changedProperties.has('product')) {
      const p = this.getProductObj()
      this.discount = Number(p.data?.discount) || 0
      this.imageUrl = p.image || p.data?.image || ''
      this.syncFields(p)
    }
  }

  getProductObj() {
    if (typeof this.product === 'string') {
      try {
        return JSON.parse(this.product)
      } catch {
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
    const stockEl = this.renderRoot?.getElementById('stockCount')
    if (stockEl) {
      stockEl.value = p.data?.stockCount !== undefined && p.data?.stockCount !== null ? String(p.data.stockCount) : '10'
    }
    const catEl = this.renderRoot?.getElementById('category')
    if (catEl) catEl.value = p.data?.category || 'electronics'
    const inStockEl = this.renderRoot?.getElementById('inStock')
    if (inStockEl) inStockEl.selected = p.data?.inStock !== false
    const pubEl = this.renderRoot?.getElementById('published')
    if (pubEl) pubEl.selected = p.status !== 'draft' && p.data?.published !== false
    const discountEl = this.renderRoot?.getElementById('discount')
    if (discountEl) discountEl.value = Number(p.data?.discount) || 0
  }

  resetForm() {
    this.product = {}
    this.discount = 0
    this.imageUrl = ''
    const f = this.renderRoot?.getElementById('product-form')
    if (f) f.reset()
    this.syncFields({})
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }))
  }

  triggerImageSelect() {
    const input = this.renderRoot?.getElementById('product-image-input')
    if (input) input.click()
  }

  async handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (file) {
      await this.uploadImageFile(file)
    }
    if (e.target) e.target.value = ''
  }

  async handleImageDrop(e) {
    e.preventDefault()
    this.draggingImage = false
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      await this.uploadImageFile(file)
    }
  }

  async uploadImageFile(file) {
    this.uploadingImage = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/v1/products/image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to upload product image')
      }
      this.imageUrl = data.image
      snack('Product image uploaded to R2', { showCloseIcon: true })
    } catch (err) {
      console.error(err)
      snack(err.message || 'Image upload failed', { showCloseIcon: true })
    } finally {
      this.uploadingImage = false
    }
  }

  removeImage() {
    this.imageUrl = ''
  }

  renderFormContent() {
    const p = this.getProductObj()
    const isEditing = Boolean(p.id)
    const initialStock =
      p.data?.stockCount !== undefined && p.data?.stockCount !== null ? String(p.data.stockCount) : '10'

    return html`
      <form
        id="product-form"
        class="w100"
        @submit=${(e) => {
          e.preventDefault()
          this.submit()
        }}>
        <div class="flex col g16">
          <div
            class="image-dropzone ${this.draggingImage ? 'dragging' : ''}"
            @dragover=${(e) => {
              e.preventDefault()
              this.draggingImage = true
            }}
            @dragleave=${() => {
              this.draggingImage = false
            }}
            @drop=${this.handleImageDrop}>
            <input
              id="product-image-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              style="display: none;"
              @change=${this.handleFileSelected} />

            ${
              this.imageUrl
                ? html`
                    <img src="${this.imageUrl}" alt="Selected product preview" class="preview-img" />
                    <div class="flex g8 flexw jcc">
                      <md-button
                        type="button"
                        color="tonal"
                        size="small"
                        ?disabled=${this.uploadingImage}
                        @click=${this.triggerImageSelect}>
                        <md-icon slot="icon">photo_camera</md-icon>
                        Replace Photo
                      </md-button>
                      <md-button
                        type="button"
                        color="outlined"
                        size="small"
                        class="error"
                        ?disabled=${this.uploadingImage}
                        @click=${this.removeImage}>
                        <md-icon slot="icon">delete</md-icon>
                        Remove
                      </md-button>
                    </div>
                  `
                : html`
                    <md-icon style="font-size: 32px; color: var(--md-sys-color-primary);">cloud_upload</md-icon>
                    <div class="text-center">
                      <div style="font-weight: 500;">Product Photo (Cloudflare R2)</div>
                      <div class="text-muted small">
                        Drag &amp; drop an image here, or choose a file (JPG, PNG, WEBP, AVIF, GIF)
                      </div>
                    </div>
                    <md-button
                      type="button"
                      color="tonal"
                      size="small"
                      ?disabled=${this.uploadingImage}
                      @click=${this.triggerImageSelect}>
                      <md-icon slot="icon">upload</md-icon>
                      ${this.uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </md-button>
                  `
            }
          </div>

          <md-text-field
            id="name"
            name="name"
            label="Name"
            value="${p.name || ''}"
            required
            minlength="2"
            placeholder="e.g. Wireless Headphones"></md-text-field>

          <md-select id="category" label="Category" required>
            <md-select-option value="electronics" ?selected=${!p.data?.category || p.data?.category === 'electronics'}>
              <div slot="headline">Electronics</div>
            </md-select-option>
            <md-select-option value="apparel" ?selected=${p.data?.category === 'apparel'}>
              <div slot="headline">Apparel</div>
            </md-select-option>
            <md-select-option value="books" ?selected=${p.data?.category === 'books'}>
              <div slot="headline">Books &amp; Media</div>
            </md-select-option>
            <md-select-option value="home" ?selected=${p.data?.category === 'home'}>
              <div slot="headline">Home &amp; Kitchen</div>
            </md-select-option>
            <md-select-option value="accessories" ?selected=${p.data?.category === 'accessories'}>
              <div slot="headline">Accessories</div>
            </md-select-option>
          </md-select>

          <md-text-field
            id="description"
            name="description"
            type="textarea"
            rows="2"
            label="Description"
            value="${p.description || ''}"
            placeholder="Brief description of the product"></md-text-field>

          <div class="two-col">
            <md-text-field
              id="price"
              name="price"
              label="Price ($)"
              value="${p.price ?? ''}"
              required
              type="number"
              placeholder="1.00"
              step="0.01"
              min="0.01"
              max="1000000"></md-text-field>

            <md-text-field
              id="stockCount"
              name="stockCount"
              label="Stock Quantity"
              value="${initialStock}"
              type="number"
              step="1"
              min="0"
              max="100000"></md-text-field>
          </div>

          <div class="field-row">
            <div class="flex col g4">
              <span style="font-weight: 500;">In Stock</span>
              <span class="text-muted small">Show item as available for purchase</span>
            </div>
            <md-switch id="inStock" ?selected=${p.data?.inStock !== false} icons></md-switch>
          </div>

          <div class="field-row">
            <div class="flex col g4">
              <span style="font-weight: 500;">Listed Publicly</span>
              <span class="text-muted small">Show in the shared marketplace (off saves as private draft)</span>
            </div>
            <md-switch
              id="published"
              ?selected=${p.status !== 'draft' && p.data?.published !== false}
              icons></md-switch>
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

          ${
            this.submitting || this.uploadingImage
              ? html`<md-progress type="linear" indeterminate shape="wavy"></md-progress>`
              : ''
          }

          <div class="flex jce g8 mt8">
            ${
              this.showCancel
                ? html`
                    <md-button type="button" color="text" @click=${this.handleCancel} ?disabled=${this.submitting}>
                      Cancel
                    </md-button>
                  `
                : ''
            }
            <md-button type="submit" color="filled" ?disabled=${this.submitting || this.uploadingImage}>
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
      <md-card class="p16 w100 mb24" style="box-sizing: border-box;"> ${this.renderFormContent()} </md-card>
    `
  }

  async submit() {
    const f = this.renderRoot.getElementById('product-form')
    if (!f.reportValidity()) return

    const current = this.getProductObj()
    const isEditing = Boolean(current.id)
    const categoryEl = this.renderRoot.getElementById('category')
    const inStockEl = this.renderRoot.getElementById('inStock')
    const publishedEl = this.renderRoot.getElementById('published')
    const discountEl = this.renderRoot.getElementById('discount')
    const stockEl = this.renderRoot.getElementById('stockCount')

    const rawStock = stockEl ? stockEl.value.trim() : ''
    const stockCount = rawStock !== '' ? Math.max(0, Math.floor(Number(rawStock) || 0)) : undefined
    const published = publishedEl ? Boolean(publishedEl.selected) : true
    const inStockSwitch = inStockEl ? Boolean(inStockEl.selected) : true

    this.submitting = true
    try {
      const payload = {
        name: this.renderRoot.getElementById('name').value,
        description: this.renderRoot.getElementById('description').value,
        price: parseFloat(this.renderRoot.getElementById('price').value),
        image: this.imageUrl || null,
        status: published ? 'active' : 'draft',
        data: {
          ...(current.data || {}),
          category: categoryEl ? categoryEl.value : current.data?.category || 'electronics',
          inStock: stockCount === 0 ? false : inStockSwitch,
          ...(stockCount !== undefined ? { stockCount } : {}),
          discount: discountEl ? Number(discountEl.value) : this.discount,
          published,
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
