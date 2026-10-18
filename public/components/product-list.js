import { LitElement, html, css } from 'lit'
import 'material/buttons/button.js'
import 'material/buttons/icon-button.js'
import 'material/icon/icon.js'
import 'material/card/card.js'
import 'material/search/search.js'
import 'material/chips/chip-set.js'
import 'material/chips/chip.js'
import 'material/badge/badge.js'
import 'material/tooltip/tooltip.js'
import 'material/divider/divider.js'
import 'material/dialog/dialog.js'
import 'material/indicators/loading.js'
import { snack } from 'material/snackbar/snackbar.js'
import '/components/confirm-dialog.js'
import '/components/product-form.js'
import { styles } from '/css/styles.js'
import { api } from 'api'

export class ProductList extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
      }
      .filter-toolbar {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 8px;
      }
      .toolbar-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
      }
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
        width: 100%;
      }
      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      .category-tag {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        background: var(--md-sys-color-surface-container-high, #ece6f0);
        color: var(--md-sys-color-on-surface-variant, #49454f);
        text-transform: capitalize;
        display: inline-block;
      }
      .sale-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        background: var(--md-sys-color-tertiary-container, #ffd8e4);
        color: var(--md-sys-color-on-tertiary-container, #31111d);
        font-weight: 600;
        display: inline-block;
      }
      .stock-tag {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
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
    products: { type: Array },
    searchQuery: { type: String },
    activeFilter: { type: String },
    loading: { type: Boolean },
    user: { type: Object },
    canManage: { type: Boolean, attribute: 'can-manage' },
    limit: { type: Number },
    editingProduct: { type: Object },
  }

  constructor() {
    super()
    this.products = []
    this.searchQuery = ''
    this.activeFilter = 'all'
    this.loading = true
    this.user = {}
    this.canManage = false
    this.limit = 0
    this.editingProduct = {}
  }

  connectedCallback() {
    super.connectedCallback()
    this.fetchData()
    this.checkAuth()
    this.onProductSaved = () => this.fetchData()
    window.addEventListener('product-saved', this.onProductSaved)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('product-saved', this.onProductSaved)
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

  async fetchData() {
    this.loading = true
    try {
      let r = await api('/v1/products')
      this.products = r.products || []
    } catch (e) {
      console.error('Failed to fetch products', e)
    } finally {
      this.loading = false
    }
  }

  handleSearch(e) {
    this.searchQuery = (e.target.value || '').toLowerCase().trim()
  }

  setFilter(filter) {
    this.activeFilter = filter
  }

  get filteredProducts() {
    const filtered = this.products.filter((p) => {
      // Query filter
      if (this.searchQuery) {
        const nameMatch = (p.name || '').toLowerCase().includes(this.searchQuery)
        const descMatch = (p.description || '').toLowerCase().includes(this.searchQuery)
        const catMatch = (p.data?.category || '').toLowerCase().includes(this.searchQuery)
        if (!nameMatch && !descMatch && !catMatch) return false
      }

      // Chip filter
      if (this.activeFilter === 'instock') {
        return p.data?.inStock !== false
      }
      if (this.activeFilter === 'sale') {
        return Boolean(p.data?.discount && p.data.discount > 0)
      }
      return true
    })

    if (this.limit > 0) {
      return filtered.slice(0, this.limit)
    }
    return filtered
  }

  openCreateDialog() {
    this.editingProduct = {}
    const form = this.renderRoot.querySelector('#dialogProductForm')
    if (form) form.resetForm()
    const dialog = this.renderRoot.querySelector('#productDialog')
    if (dialog) dialog.show()
  }

  openEditDialog(product) {
    this.editingProduct = {
      ...product,
      data: { ...(product.data || {}) },
    }
    const dialog = this.renderRoot.querySelector('#productDialog')
    if (dialog) dialog.show()
  }

  closeProductDialog() {
    const dialog = this.renderRoot.querySelector('#productDialog')
    if (dialog) dialog.close()
  }

  handleFormSaved() {
    this.closeProductDialog()
    this.fetchData()
  }

  render() {
    const list = this.filteredProducts
    const loggedIn = this.isLoggedIn()
    const isEditing = Boolean(this.editingProduct?.id)

    return html`
      <confirm-dialog id="confirmDialog"></confirm-dialog>

      ${loggedIn
        ? html`
            <md-dialog id="productDialog">
              <div slot="headline">${isEditing ? 'Edit Product' : 'New Product'}</div>
              <div slot="content" style="padding-top: 8px;">
                <product-form
                  id="dialogProductForm"
                  embedded
                  show-cancel
                  .product=${this.editingProduct}
                  @saved=${this.handleFormSaved}
                  @cancel=${this.closeProductDialog}></product-form>
              </div>
            </md-dialog>
          `
        : ''}

      <div class="flex col g16 w100">
        <!-- Search, Filter Chips, and Primary Action -->
        <div class="filter-toolbar">
          <md-search
            placeholder="Search products by title, category, or description..."
            @input=${this.handleSearch}
            class="w100"></md-search>

          <div class="toolbar-row">
            <md-chip-set>
              <md-chip
                type="filter"
                label="All (${this.products.length})"
                ?selected=${this.activeFilter === 'all'}
                @click=${() => this.setFilter('all')}>
                <md-icon slot="icon">view_list</md-icon>
              </md-chip>
              <md-chip
                type="filter"
                label="In Stock"
                ?selected=${this.activeFilter === 'instock'}
                @click=${() => this.setFilter('instock')}>
                <md-icon slot="icon">check_circle</md-icon>
              </md-chip>
              <md-chip
                type="filter"
                label="On Sale"
                ?selected=${this.activeFilter === 'sale'}
                @click=${() => this.setFilter('sale')}>
                <md-icon slot="icon">local_offer</md-icon>
              </md-chip>
            </md-chip-set>

            <div class="flex aic g8">
              ${loggedIn
                ? html`
                    <md-button color="filled" @click=${() => this.openCreateDialog()}>
                      <md-icon slot="icon">add</md-icon>
                      New Product
                    </md-button>
                  `
                : html`
                    <a href="/signin">
                      <md-button color="tonal">
                        <md-icon slot="icon">login</md-icon>
                        Sign in to add or edit
                      </md-button>
                    </a>
                  `}
            </div>
          </div>
        </div>

        ${this.loading
          ? html`
              <div class="flex col aic jcc p40 g16">
                <md-loading size="48" contained></md-loading>
                <div class="text-muted">Loading products...</div>
              </div>
            `
          : list.length === 0
            ? html`
                <md-card class="p24 text-center">
                  <div class="flex col aic g12 p16">
                    <div class="text-muted">
                      ${this.searchQuery || this.activeFilter !== 'all'
                        ? 'No products match your search or filter.'
                        : loggedIn
                          ? 'No products yet. Click "New Product" to add your first item!'
                          : 'No products available yet. Sign in to add the first product!'}
                    </div>
                    ${loggedIn && !this.searchQuery && this.activeFilter === 'all'
                      ? html`
                          <md-button color="filled" @click=${() => this.openCreateDialog()}>
                            <md-icon slot="icon">add</md-icon>
                            Create First Product
                          </md-button>
                        `
                      : ''}
                  </div>
                </md-card>
              `
            : html`
                <div class="products-grid">
                  ${list.map((p) => {
                    const isOutOfStock = p.data?.inStock === false
                    const discount = p.data?.discount || 0
                    const category = p.data?.category

                    return html`
                      <md-card class="p16 flex col jcsb w100 g12" style="box-sizing: border-box;">
                        <div class="flex col g8">
                          <div class="card-header">
                            <div class="flex col g4">
                              <div class="title-large" style="font-weight: 600;">
                                <a href="/products/${p.id}">${p.name}</a>
                              </div>
                              <div class="flex g8 aic flexw mt4">
                                ${category ? html`<span class="category-tag">${category}</span>` : ''}
                                <span class="stock-tag ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                                  ${isOutOfStock ? 'Out of stock' : 'In stock'}
                                </span>
                                ${discount > 0 ? html`<span class="sale-badge">${discount}% OFF</span>` : ''}
                              </div>
                            </div>

                            ${loggedIn
                              ? html`
                                  <div class="flex aic g4">
                                    <md-tooltip text="Edit product">
                                      <md-icon-button @click=${() => this.openEditDialog(p)}>
                                        <md-icon>edit</md-icon>
                                      </md-icon-button>
                                    </md-tooltip>
                                    <md-tooltip text="Delete product">
                                      <md-icon-button class="error" @click=${() => this.deleteProduct(p.id)}>
                                        <md-icon>delete</md-icon>
                                      </md-icon-button>
                                    </md-tooltip>
                                  </div>
                                `
                              : ''}
                          </div>

                          ${p.description
                            ? html`<div style="color: var(--md-sys-color-on-surface-variant); line-height: 1.5;">
                                ${p.description}
                              </div>`
                            : ''}
                        </div>

                        <div class="flex aic jcsb mt8 pt12" style="border-top: 1px solid var(--md-sys-color-outline-variant, #ece6f0);">
                          <div class="flex aic g8">
                            <span style="font-weight: 700; font-size: 1.25rem; color: var(--md-sys-color-primary);">
                              $${Number(p.price).toFixed(2)}
                            </span>
                            ${discount > 0
                              ? html`
                                  <span
                                    style="text-decoration: line-through; color: var(--md-sys-color-outline); font-size: 0.9rem;">
                                    $${(p.price / (1 - discount / 100)).toFixed(2)}
                                  </span>
                                `
                              : ''}
                          </div>
                          <a href="/products/${p.id}">
                            <md-button color="text" size="small">
                              View Details
                              <md-icon slot="icon">arrow_forward</md-icon>
                            </md-button>
                          </a>
                        </div>
                      </md-card>
                    `
                  })}
                </div>
              `}
      </div>
    `
  }

  async deleteProduct(id) {
    const dialog = this.renderRoot.querySelector('#confirmDialog')
    const confirmed = await dialog.confirm({
      headline: 'Delete Product',
      message: 'Are you sure you want to delete this product?',
      confirmText: 'Delete',
      destructive: true,
      icon: 'delete',
    })
    if (!confirmed) return

    const response = await fetch(`/v1/products/${id}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      snack('Product deleted successfully', { showCloseIcon: true })
      this.products = this.products.filter((p) => p.id !== id)
      this.requestUpdate()
    } else {
      console.error('Failed to delete product')
      snack('Failed to delete product.', { showCloseIcon: true })
    }
  }
}

customElements.define('product-list', ProductList)
