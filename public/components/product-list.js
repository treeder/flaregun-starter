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
import 'material/indicators/loading.js'
import { snack } from 'material/snackbar/snackbar.js'
import '/components/confirm-dialog.js'
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
    `,
  ]

  static properties = {
    products: { type: Array },
    searchQuery: { type: String },
    activeFilter: { type: String },
    loading: { type: Boolean },
  }

  constructor() {
    super()
    this.products = []
    this.searchQuery = ''
    this.activeFilter = 'all'
    this.loading = true
  }

  connectedCallback() {
    super.connectedCallback()
    this.fetchData()
    this.onProductSaved = () => this.fetchData()
    window.addEventListener('product-saved', this.onProductSaved)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('product-saved', this.onProductSaved)
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
    return this.products.filter((p) => {
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
  }

  render() {
    const list = this.filteredProducts

    return html`
      <confirm-dialog id="confirmDialog"></confirm-dialog>

      <div class="flex col g16 w100">
        <!-- Search and Filter Chips -->
        <div class="filter-toolbar">
          <md-search
            placeholder="Search products by title, category, or description..."
            @input=${this.handleSearch}
            class="w100"></md-search>

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
                  <div class="text-muted p16">
                    ${this.searchQuery || this.activeFilter !== 'all'
                      ? 'No products match your search or filter.'
                      : 'No products yet. Use the form to add your first product!'}
                  </div>
                </md-card>
              `
            : list.map((p) => {
                const isOutOfStock = p.data?.inStock === false
                const discount = p.data?.discount || 0
                const category = p.data?.category

                return html`
                  <md-card class="p16 flex col w100 g12" style="box-sizing: border-box;">
                    <div class="flex col g8">
                      <div class="card-header">
                        <div class="flex col g4">
                          <div class="headline-medium">
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

                        <div class="flex aic g4">
                          <md-tooltip text="Delete product">
                            <md-icon-button class="error" @click=${() => this.deleteProduct(p.id)}>
                              <md-icon>delete</md-icon>
                            </md-icon-button>
                          </md-tooltip>
                        </div>
                      </div>

                      ${p.description
                        ? html`<div style="color: var(--md-sys-color-on-surface-variant);">${p.description}</div>`
                        : ''}

                      <div class="flex aic jcsb mt8">
                        <div class="flex aic g8">
                          <span style="font-weight: bold; font-size: 1.25rem; color: var(--md-sys-color-primary);">
                            $${p.price}
                          </span>
                          ${discount > 0
                            ? html`
                                <span style="text-decoration: line-through; color: var(--md-sys-color-outline); font-size: 0.9rem;">
                                  $${(p.price / (1 - discount / 100)).toFixed(2)}
                                </span>
                              `
                            : ''}
                        </div>
                        ${p.data?.x ? html`<span class="text-muted small">${p.data.x}</span>` : ''}
                      </div>
                    </div>
                  </md-card>
                `
              })}
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
