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
import { addToCart } from '/components/cart-drawer.js'
import { styles } from '/css/styles.js'
import { api } from 'api'
import state from 'state'

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
        margin-block-end: 6px;
        padding: 14px 16px;
        border-radius: 18px;
        background: var(--md-card-container-color, var(--md-sys-color-surface, #ffffff));
        border: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant, #c2c7ce) 72%, transparent);
      }
      .filter-toolbar md-search {
        --md-search-container-max-width: 100%;
        max-inline-size: 100%;
        inline-size: 100%;
      }
      .toolbar-row {
        display: flex;
        align-items: safe center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
      }
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
        gap: 18px;
        inline-size: 100%;
      }
      .product-card-shell {
        container-type: inline-size;
        overflow: clip;
        box-sizing: border-box;
        border-radius: 18px;
        border: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant, #c2c7ce) 75%, transparent);
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease,
          translate 0.2s ease;
      }
      .product-card-shell:hover {
        border-color: color-mix(in oklab, var(--md-sys-color-primary) 42%, var(--md-sys-color-outline-variant));
        box-shadow: 0 14px 28px -14px color-mix(in oklab, var(--md-sys-color-primary) 24%, transparent);
      }
      @media (prefers-reduced-motion: no-preference) {
        .product-card-shell:hover {
          translate: 0 -2px;
        }
      }
      .product-article {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        block-size: 100%;
      }
      .product-article > img {
        inline-size: 100%;
        block-size: auto;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        display: block;
        background: var(--md-sys-color-surface-container, #f3edf7);
        border-block-end: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant) 65%, transparent);
      }
      .product-media-placeholder {
        inline-size: 100%;
        aspect-ratio: 16 / 10;
        display: flex;
        align-items: center;
        justify-content: center;
        background:
          radial-gradient(
            circle at 25% 25%,
            color-mix(in oklab, var(--md-sys-color-primary) 16%, transparent) 0%,
            transparent 60%
          ),
          linear-gradient(
            135deg,
            color-mix(in oklab, var(--md-sys-color-secondary-container) 65%, var(--md-sys-color-surface)) 0%,
            color-mix(in oklab, var(--md-sys-color-primary-container) 45%, var(--md-sys-color-surface)) 100%
          );
        border-block-end: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant) 65%, transparent);
      }
      .placeholder-emblem {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: 64px;
        block-size: 64px;
        border-radius: 20px;
        background: color-mix(in oklab, var(--md-sys-color-surface) 78%, transparent);
        color: var(--md-sys-color-primary);
        border: 1px solid color-mix(in oklab, var(--md-sys-color-primary) 20%, transparent);
        box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.12);
      }
      .placeholder-emblem md-icon {
        font-size: 30px;
      }
      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        padding: 16px 18px 0;
      }
      .card-title {
        margin: 0;
        font-size: 1.12rem;
        line-height: 1.35;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .card-title a {
        color: var(--md-sys-color-on-surface);
        text-decoration: none;
      }
      .card-title a:hover,
      .card-title a:focus-visible {
        color: var(--md-sys-color-primary);
      }
      .card-content {
        padding: 10px 18px 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1 1 auto;
      }
      .card-desc {
        margin: 0;
        color: var(--md-sys-color-on-surface-variant);
        line-height: 1.52;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        line-clamp: 3;
        overflow: clip;
      }
      .card-footer {
        display: flex;
        align-items: safe center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-block-start: 14px;
        padding: 12px 18px 16px;
        border-block-start: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant) 55%, transparent);
      }
      .category-tag {
        font-size: 0.72rem;
        font-weight: 600;
        padding: 2px 9px;
        border-radius: 999px;
        background: var(--md-sys-color-surface-container-high, #ece6f0);
        color: var(--md-sys-color-on-surface-variant, #49454f);
        text-transform: capitalize;
        display: inline-block;
      }
      .sale-badge {
        font-size: 0.72rem;
        padding: 2px 9px;
        border-radius: 999px;
        background: var(--md-sys-color-tertiary-container, #ffd8e4);
        color: var(--md-sys-color-on-tertiary-container, #31111d);
        font-weight: 700;
        display: inline-block;
      }
      .draft-badge {
        font-size: 0.72rem;
        padding: 2px 9px;
        border-radius: 999px;
        background: color-mix(in oklab, #f59e0b 18%, var(--md-sys-color-surface));
        color: color-mix(in oklab, #b45309 80%, var(--md-sys-color-on-surface));
        font-weight: 600;
        display: inline-block;
      }
      .stock-tag {
        font-size: 0.72rem;
        padding: 2px 9px;
        border-radius: 999px;
        font-weight: 600;
      }
      .in-stock {
        background: color-mix(in oklab, #16a34a 15%, var(--md-sys-color-surface));
        color: color-mix(in oklab, #15803d 82%, var(--md-sys-color-on-surface));
      }
      .out-of-stock {
        background: color-mix(in oklab, var(--md-sys-color-error, #ba1a1a) 14%, var(--md-sys-color-surface));
        color: var(--md-sys-color-error, #ba1a1a);
      }
      .rating-pill {
        display: inline-flex;
        align-items: safe center;
        gap: 3px;
        font-size: 0.75rem;
        font-weight: 700;
        color: color-mix(in oklab, #b45309 82%, var(--md-sys-color-on-surface));
        background: color-mix(in oklab, #f59e0b 18%, var(--md-sys-color-surface));
        padding: 2px 8px;
        border-radius: 999px;
      }
      .rating-pill md-icon {
        font-size: 14px;
      }
      .seller-row {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--md-sys-color-on-surface-variant);
      }
      .seller-avatar {
        inline-size: 20px;
        block-size: 20px;
        border-radius: 50%;
        object-fit: cover;
        background: var(--md-sys-color-primary-container, #eaddff);
        color: var(--md-sys-color-on-primary-container, #21005d);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
      }
      md-dialog {
        --md-dialog-container-min-width: min(540px, 94dvw);
      }
    `,
  ]

  static properties = {
    products: { type: Array },
    searchQuery: { type: String },
    activeFilter: { type: String },
    loading: { type: Boolean },
    addingProductId: { type: String },
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
    this.addingProductId = ''
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
    if (!this.isLoggedIn() && typeof document !== 'undefined' && /(?:^|;\s*)session=/.test(document.cookie)) {
      try {
        const res = await api('/v1/users/me')
        if (res?.user) {
          this.user = res.user
          this.canManage = true
        }
      } catch {}
    }
  }

  getUser() {
    if (typeof this.user === 'string') {
      if (!this.user) return state.get('user') || {}
      try {
        return JSON.parse(this.user)
      } catch {
        return state.get('user') || {}
      }
    }
    if (this.user && (this.user.id || this.user.email)) {
      return this.user
    }
    return state.get('user') || {}
  }

  isLoggedIn() {
    const u = this.getUser()
    return Boolean(this.canManage || u.id || u.email)
  }

  isProductOwner(product) {
    const u = this.getUser()
    return Boolean(u?.id && product?.userId && u.id === product.userId)
  }

  async fetchData() {
    this.loading = true
    try {
      const r = await api('/v1/products')
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
    const u = this.getUser()
    const filtered = this.products.filter((p) => {
      if (this.searchQuery) {
        const nameMatch = (p.name || '').toLowerCase().includes(this.searchQuery)
        const descMatch = (p.description || '').toLowerCase().includes(this.searchQuery)
        const catMatch = (p.data?.category || '').toLowerCase().includes(this.searchQuery)
        const sellerMatch = (p.seller?.name || '').toLowerCase().includes(this.searchQuery)
        if (!nameMatch && !descMatch && !catMatch && !sellerMatch) return false
      }

      if (this.activeFilter === 'mine') {
        return Boolean(u?.id && p.userId === u.id)
      }
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

  async handleAddToCart(product) {
    if (this.addingProductId) return
    this.addingProductId = product.id
    try {
      await addToCart(product.id, 1, product.name)
    } catch (err) {
      snack(err.message || 'Could not add item to cart', { showCloseIcon: true })
    } finally {
      this.addingProductId = ''
    }
  }

  categoryIcon(category) {
    const key = String(category || '').toLowerCase()
    if (key.includes('electr') || key.includes('tech') || key.includes('audio')) return 'devices'
    if (key.includes('book') || key.includes('guide')) return 'menu_book'
    if (key.includes('home') || key.includes('office')) return 'chair'
    if (key.includes('access')) return 'watch'
    return 'shopping_bag'
  }

  renderSeller(p) {
    if (p.seller?.id) {
      const initial = (p.seller.name || 'S').charAt(0).toUpperCase()
      return html`
        <div class="seller-row">
          ${
            p.seller.image
              ? html`<img src="${p.seller.image}" alt="" class="seller-avatar" loading="lazy" />`
              : html`<span class="seller-avatar" aria-hidden="true">${initial}</span>`
          }
          <span>by ${p.seller.name}</span>
        </div>
      `
    }
    return html`
      <div class="seller-row">
        <md-icon style="font-size: 16px; color: var(--md-sys-color-primary);">verified</md-icon>
        <span>Official Store</span>
      </div>
    `
  }

  render() {
    const list = this.filteredProducts
    const loggedIn = this.isLoggedIn()
    const isEditing = Boolean(this.editingProduct?.id)
    const u = this.getUser()
    const myCount = u?.id ? this.products.filter((p) => p.userId === u.id).length : 0

    return html`
      <confirm-dialog id="confirmDialog"></confirm-dialog>

      ${
        loggedIn
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
          : ''
      }

      <div class="flex col g16 w100">
        <search class="filter-toolbar" aria-label="Marketplace product filters">
          <md-search
            placeholder="Search marketplace by product, category, seller, or description..."
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
              ${
                loggedIn
                  ? html`
                      <md-chip
                        type="filter"
                        label="My Listings (${myCount})"
                        ?selected=${this.activeFilter === 'mine'}
                        @click=${() => this.setFilter('mine')}>
                        <md-icon slot="icon">person</md-icon>
                      </md-chip>
                    `
                  : ''
              }
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
              ${
                loggedIn
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
                          Sign in to sell
                        </md-button>
                      </a>
                    `
              }
            </div>
          </div>
        </search>

        ${
          this.loading
            ? html`
                <div class="flex col aic jcc p40 g16">
                  <md-loading size="48" contained></md-loading>
                  <div class="text-muted">Loading marketplace...</div>
                </div>
              `
            : list.length === 0
              ? html`
                  <md-card class="p24 text-center">
                    <div class="flex col aic g12 p16">
                      <div class="text-muted">
                        ${
                          this.activeFilter === 'mine'
                            ? 'You have not listed any products yet.'
                            : this.searchQuery || this.activeFilter !== 'all'
                              ? 'No products match your search or filter.'
                              : loggedIn
                                ? 'No products yet. Click "New Product" to add your first item!'
                                : 'No products available yet. Sign in to add the first product!'
                        }
                      </div>
                      ${
                        loggedIn && (!this.searchQuery || this.activeFilter === 'mine')
                          ? html`
                              <md-button color="filled" @click=${() => this.openCreateDialog()}>
                                <md-icon slot="icon">add</md-icon>
                                Create Product Listing
                              </md-button>
                            `
                          : ''
                      }
                    </div>
                  </md-card>
                `
              : html`
                  <div class="products-grid">
                    ${list.map((p) => {
                      const stockCount =
                        typeof p.data?.stockCount === 'number' ? Math.max(0, Math.floor(p.data.stockCount)) : null
                      const isOutOfStock = p.data?.inStock === false || (stockCount !== null && stockCount <= 0)
                      const discount = Math.min(Math.max(Number(p.data?.discount) || 0, 0), 99)
                      const basePrice = Math.max(0, Number(p.price) || 0)
                      const finalPrice = Math.round(basePrice * (1 - discount / 100) * 100) / 100
                      const category = p.data?.category
                      const ratingAvg = Number(p.data?.ratingAvg) || 0
                      const ratingCount = Number(p.data?.ratingCount) || 0
                      const isOwner = this.isProductOwner(p)
                      const isDraft = p.status === 'draft' || p.data?.published === false

                      return html`
                        <md-card class="w100 product-card-shell">
                          <article class="product-article">
                            ${
                              p.image
                                ? html`<img src="${p.image}" alt="${p.name}" width="640" height="400" loading="lazy" />`
                                : html`
                                    <div class="product-media-placeholder" aria-hidden="true">
                                      <span class="placeholder-emblem">
                                        <md-icon>${this.categoryIcon(category)}</md-icon>
                                      </span>
                                    </div>
                                  `
                            }

                            <header class="card-header">
                              <div class="flex col g4" style="min-inline-size: 0;">
                                <h3 class="card-title">
                                  <a href="/products/${p.id}">${p.name}</a>
                                </h3>
                                <div class="flex g8 aic flexw mt4">
                                  ${category ? html`<span class="category-tag">${category}</span>` : ''}
                                  <span class="stock-tag ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                                    ${
                                      isOutOfStock
                                        ? 'Out of stock'
                                        : stockCount !== null
                                          ? `${stockCount} in stock`
                                          : 'In stock'
                                    }
                                  </span>
                                  ${discount > 0 ? html`<span class="sale-badge">${discount}% OFF</span>` : ''}
                                  ${isDraft ? html`<span class="draft-badge">Draft</span>` : ''}
                                  ${
                                    ratingCount > 0
                                      ? html`
                                          <span
                                            class="rating-pill"
                                            aria-label="Rated ${ratingAvg} out of 5 from ${ratingCount} reviews">
                                            <md-icon aria-hidden="true">star</md-icon>
                                            ${ratingAvg.toFixed(1)} (${ratingCount})
                                          </span>
                                        `
                                      : ''
                                  }
                                </div>
                              </div>

                              ${
                                isOwner
                                  ? html`
                                      <div class="flex aic g4">
                                        <md-tooltip text="Edit product">
                                          <md-icon-button
                                            aria-label="Edit ${p.name}"
                                            @click=${() => this.openEditDialog(p)}>
                                            <md-icon>edit</md-icon>
                                          </md-icon-button>
                                        </md-tooltip>
                                        <md-tooltip text="Delete product">
                                          <md-icon-button
                                            class="error"
                                            aria-label="Delete ${p.name}"
                                            @click=${() => this.deleteProduct(p.id)}>
                                            <md-icon>delete</md-icon>
                                          </md-icon-button>
                                        </md-tooltip>
                                      </div>
                                    `
                                  : ''
                              }
                            </header>

                            <div class="card-content">
                              ${this.renderSeller(p)}
                              ${p.description ? html`<p class="card-desc">${p.description}</p>` : ''}
                            </div>

                            <footer class="card-footer">
                              <div class="flex aic g8">
                                <span style="font-weight: 700; font-size: 1.25rem; color: var(--md-sys-color-primary);">
                                  $${finalPrice.toFixed(2)}
                                </span>
                                ${
                                  discount > 0
                                    ? html`
                                        <span
                                          style="text-decoration: line-through; color: var(--md-sys-color-outline); font-size: 0.9rem;">
                                          $${basePrice.toFixed(2)}
                                        </span>
                                      `
                                    : ''
                                }
                              </div>

                              <div class="flex aic g8">
                                ${
                                  !isOutOfStock && !isDraft
                                    ? html`
                                        <md-button
                                          type="button"
                                          color="tonal"
                                          size="small"
                                          aria-label="Add ${p.name} to cart"
                                          ?disabled=${this.addingProductId === p.id}
                                          @click=${() => this.handleAddToCart(p)}>
                                          <md-icon slot="icon">add_shopping_cart</md-icon>
                                          ${this.addingProductId === p.id ? 'Adding...' : 'Add'}
                                        </md-button>
                                      `
                                    : html`
                                        <a href="/products/${p.id}">
                                          <md-button color="text" size="small">
                                            Details
                                            <span
                                              style="position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden;">
                                              for ${p.name}
                                            </span>
                                            <md-icon slot="icon">arrow_forward</md-icon>
                                          </md-button>
                                        </a>
                                      `
                                }
                              </div>
                            </footer>
                          </article>
                        </md-card>
                      `
                    })}
                  </div>
                `
        }
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
