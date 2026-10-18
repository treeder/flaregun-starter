import { LitElement, html, css } from 'lit'
import 'material/buttons/button.js'
import 'material/buttons/icon-button.js'
import 'material/icon/icon.js'
import 'material/card/card.js'
import 'material/dialog/dialog.js'
import 'material/divider/divider.js'
import { snack } from 'material/snackbar/snackbar.js'
import '/components/confirm-dialog.js'
import '/components/product-form.js'
import { styles } from '/css/styles.js'
import { api } from 'api'

export class ProductDetail extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
      }
      .category-tag {
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 16px;
        background: var(--md-sys-color-surface-container-high, #ece6f0);
        color: var(--md-sys-color-on-surface-variant, #49454f);
        text-transform: capitalize;
        font-weight: 500;
      }
      .sale-badge {
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 16px;
        background: var(--md-sys-color-tertiary-container, #ffd8e4);
        color: var(--md-sys-color-on-tertiary-container, #31111d);
        font-weight: 600;
      }
      .stock-tag {
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 16px;
        font-weight: 500;
      }
      .in-stock {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .out-of-stock {
        background: #ffebee;
        color: #c62828;
      }
      md-dialog {
        --md-dialog-container-min-width: min(520px, 92vw);
      }
    `,
  ]

  static properties = {
    product: { type: Object },
    user: { type: Object },
    canManage: { type: Boolean, attribute: 'can-manage' },
  }

  constructor() {
    super()
    this.product = {}
    this.user = {}
    this.canManage = false
  }

  connectedCallback() {
    super.connectedCallback()
    this.checkAuth()
  }

  async checkAuth() {
    if (
      !this.isLoggedIn() &&
      typeof document !== 'undefined' &&
      (document.cookie.includes('session=') || document.cookie.includes('userId='))
    ) {
      try {
        const res = await api('/v1/users/me')
        if (res?.user) {
          this.user = res.user
          this.canManage = true
        }
      } catch (e) {}
    }
  }

  getProduct() {
    if (typeof this.product === 'string') {
      if (!this.product) return {}
      try {
        return JSON.parse(this.product)
      } catch (e) {
        return {}
      }
    }
    return this.product || {}
  }

  getUser() {
    if (typeof this.user === 'string') {
      if (!this.user) return {}
      try {
        return JSON.parse(this.user)
      } catch (e) {
        return {}
      }
    }
    return this.user || {}
  }

  isLoggedIn() {
    const u = this.getUser()
    return Boolean(this.canManage || u.id || u.email)
  }

  openEditDialog() {
    const dialog = this.renderRoot.querySelector('#editDialog')
    if (dialog) dialog.show()
  }

  closeEditDialog() {
    const dialog = this.renderRoot.querySelector('#editDialog')
    if (dialog) dialog.close()
  }

  handleSaved(e) {
    if (e.detail) {
      this.product = e.detail
    }
    this.closeEditDialog()
  }

  async deleteProduct() {
    const p = this.getProduct()
    if (!p.id) return

    const dialog = this.renderRoot.querySelector('#confirmDialog')
    const confirmed = await dialog.confirm({
      headline: 'Delete Product',
      message: `Are you sure you want to delete "${p.name}"?`,
      confirmText: 'Delete',
      destructive: true,
      icon: 'delete',
    })
    if (!confirmed) return

    const res = await fetch(`/v1/products/${p.id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      snack('Product deleted', { showCloseIcon: true })
      window.location.href = '/products'
    } else {
      snack('Failed to delete product', { showCloseIcon: true })
    }
  }

  render() {
    const p = this.getProduct()
    const loggedIn = this.isLoggedIn()

    if (!p || !p.id) {
      return html`
        <md-card class="p24 text-center">
          <div class="flex col aic g16">
            <div class="headline-small">Product Not Found</div>
            <div class="text-muted">The product you are looking for does not exist or has been removed.</div>
            <a href="/products">
              <md-button color="filled">
                <md-icon slot="icon">arrow_back</md-icon>
                Back to Products
              </md-button>
            </a>
          </div>
        </md-card>
      `
    }

    const isOutOfStock = p.data?.inStock === false
    const discount = p.data?.discount || 0
    const category = p.data?.category

    return html`
      <confirm-dialog id="confirmDialog"></confirm-dialog>

      ${loggedIn
        ? html`
            <md-dialog id="editDialog">
              <div slot="headline">Edit Product</div>
              <div slot="content" style="padding-top: 8px;">
                <product-form
                  embedded
                  show-cancel
                  .product=${p}
                  @saved=${this.handleSaved}
                  @cancel=${this.closeEditDialog}></product-form>
              </div>
            </md-dialog>
          `
        : ''}

      <div class="flex col g20">
        <div class="flex aic jcsb flexw g12">
          <a href="/products">
            <md-button color="text">
              <md-icon slot="icon">arrow_back</md-icon>
              Back to Products
            </md-button>
          </a>

          ${loggedIn
            ? html`
                <div class="flex aic g8">
                  <md-button color="tonal" @click=${this.openEditDialog}>
                    <md-icon slot="icon">edit</md-icon>
                    Edit Product
                  </md-button>
                  <md-button color="outlined" class="error" @click=${this.deleteProduct}>
                    <md-icon slot="icon">delete</md-icon>
                    Delete
                  </md-button>
                </div>
              `
            : html`
                <a href="/signin?redirect=/products/${p.id}">
                  <md-button color="tonal">
                    <md-icon slot="icon">login</md-icon>
                    Sign in to edit
                  </md-button>
                </a>
              `}
        </div>

        <md-card class="p24 flex col g16">
          <div class="flex col g8">
            <div class="flex g8 aic flexw">
              ${category ? html`<span class="category-tag">${category}</span>` : ''}
              <span class="stock-tag ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                ${isOutOfStock ? 'Out of stock' : 'In stock'}
              </span>
              ${discount > 0 ? html`<span class="sale-badge">${discount}% OFF</span>` : ''}
            </div>

            <div class="display-medium mt8" style="font-size: 2rem; line-height: 2.5rem; font-weight: 600;">
              ${p.name}
            </div>
          </div>

          <div class="flex aic g12">
            <span style="font-weight: 700; font-size: 1.75rem; color: var(--md-sys-color-primary);">
              $${Number(p.price).toFixed(2)}
            </span>
            ${discount > 0
              ? html`
                  <span style="text-decoration: line-through; color: var(--md-sys-color-outline); font-size: 1.1rem;">
                    $${(p.price / (1 - discount / 100)).toFixed(2)}
                  </span>
                `
              : ''}
          </div>

          <md-divider></md-divider>

          <div class="flex col g8">
            <div class="title-medium">Description</div>
            <div style="color: var(--md-sys-color-on-surface-variant); line-height: 1.6; font-size: 1rem;">
              ${p.description || 'No description provided.'}
            </div>
          </div>
        </md-card>
      </div>
    `
  }
}

customElements.define('product-detail', ProductDetail)
