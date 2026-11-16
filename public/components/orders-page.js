import { LitElement, html, css } from 'lit'
import 'material/buttons/button.js'
import 'material/card/card.js'
import 'material/divider/divider.js'
import 'material/icon/icon.js'
import 'material/indicators/loading.js'
import { styles } from '/css/styles.js'
import { api } from 'api'
import state from 'state'

export class OrdersPage extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
      }
      .orders-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .order-card {
        container-type: inline-size;
      }
      .order-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 999px;
        background: #e8f5e9;
        color: #2e7d32;
        text-transform: capitalize;
      }
      .order-items {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .order-line {
        display: grid;
        grid-template-columns: 52px 1fr auto;
        gap: 12px;
        align-items: center;
      }
      .line-thumb {
        inline-size: 52px;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 8px;
        background: var(--md-sys-color-surface-container-high, #ece6f0);
      }
      .line-thumb-fallback {
        inline-size: 52px;
        aspect-ratio: 1 / 1;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--md-sys-color-surface-container-high, #ece6f0);
        color: var(--md-sys-color-on-surface-variant);
      }
    `,
  ]

  static properties = {
    user: { type: Object },
    orders: { type: Array },
    loading: { type: Boolean },
  }

  constructor() {
    super()
    this.user = {}
    this.orders = []
    this.loading = true
  }

  connectedCallback() {
    super.connectedCallback()
    this.loadOrders()
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
    return Boolean(u.id || u.email)
  }

  async loadOrders() {
    if (!this.isLoggedIn() && typeof document !== 'undefined' && /(?:^|;\s*)session=/.test(document.cookie)) {
      try {
        const me = await api('/v1/users/me')
        if (me?.user) this.user = me.user
      } catch {}
    }

    if (!this.isLoggedIn()) {
      this.loading = false
      return
    }

    this.loading = true
    try {
      const res = await api('/v1/orders')
      this.orders = res?.orders || []
    } catch (err) {
      console.error('Failed to load orders', err)
    } finally {
      this.loading = false
    }
  }

  render() {
    if (!this.isLoggedIn() && !this.loading) {
      return html`
        <md-card class="p24 text-center">
          <div class="flex col aic g16 p16">
            <md-icon style="font-size: 44px; color: var(--md-sys-color-primary);">receipt_long</md-icon>
            <h1 class="headline-small" style="margin: 0;">Sign in to View Your Orders</h1>
            <p class="text-muted" style="margin: 0; max-width: 460px;">
              Your order history and confirmation receipts are tied to your account.
            </p>
            <a href="/signin?redirect=/orders">
              <md-button color="filled">
                <md-icon slot="icon">login</md-icon>
                Sign In
              </md-button>
            </a>
          </div>
        </md-card>
      `
    }

    return html`
      <div class="flex col g20">
        <div class="flex jcsb aic flexw g12">
          <div class="flex col g4">
            <h1 class="headline-medium" style="margin: 0; font-weight: 600;">My Orders</h1>
            <div class="text-muted">Review your marketplace purchases and order receipts.</div>
          </div>
          <a href="/products">
            <md-button color="tonal">
              <md-icon slot="icon">storefront</md-icon>
              Continue Shopping
            </md-button>
          </a>
        </div>

        ${
          this.loading
            ? html`
                <div class="flex col aic jcc p40 g16">
                  <md-loading size="48" contained></md-loading>
                  <div class="text-muted">Loading orders...</div>
                </div>
              `
            : this.orders.length === 0
              ? html`
                  <md-card class="p24 text-center">
                    <div class="flex col aic g12 p16">
                      <md-icon style="font-size: 44px; color: var(--md-sys-color-outline);">shopping_bag</md-icon>
                      <div class="title-medium">No orders yet</div>
                      <div class="text-muted">
                        Add items from the marketplace to your cart and complete a demo checkout.
                      </div>
                      <a href="/products">
                        <md-button color="filled">
                          <md-icon slot="icon">storefront</md-icon>
                          Browse Marketplace
                        </md-button>
                      </a>
                    </div>
                  </md-card>
                `
              : html`
                  <ul class="orders-list" role="list">
                    ${this.orders.map(
                      (order) => html`
                        <li>
                          <md-card class="p20 flex col g16 order-card">
                            <article class="flex col g16">
                              <header class="order-header">
                                <div class="flex col g4">
                                  <div class="flex aic g8 flexw">
                                    <h2 class="title-medium" style="margin: 0; font-weight: 700;">
                                      ${order.orderNumber}
                                    </h2>
                                    <span class="status-pill">
                                      <md-icon style="font-size: 15px;">check_circle</md-icon>
                                      ${order.status || 'confirmed'}
                                    </span>
                                  </div>
                                  <div class="text-muted small">
                                    Placed ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'recently'}
                                    ${order.shippingAddress ? html` &bull; Ship to: ${order.shippingAddress}` : ''}
                                  </div>
                                </div>

                                <div class="flex col" style="text-align: end;">
                                  <span class="text-muted small">Total</span>
                                  <span
                                    style="font-size: 1.25rem; font-weight: 700; color: var(--md-sys-color-primary);">
                                    $${Number(order.total).toFixed(2)}
                                  </span>
                                </div>
                              </header>

                              <md-divider></md-divider>

                              <ul class="order-items" role="list">
                                ${(order.items || []).map(
                                  (item) => html`
                                    <li class="order-line">
                                      ${
                                        item.image
                                          ? html`<img src="${item.image}" alt="" class="line-thumb" loading="lazy" />`
                                          : html`<div class="line-thumb-fallback" aria-hidden="true">
                                              <md-icon>inventory_2</md-icon>
                                            </div>`
                                      }
                                      <div class="flex col g4">
                                        <a
                                          href="/products/${item.productId}"
                                          style="font-weight: 600; color: var(--md-sys-color-on-surface);">
                                          ${item.name}
                                        </a>
                                        <div class="text-muted small">
                                          Qty ${item.quantity} &times; $${Number(item.finalUnitPrice).toFixed(2)}
                                        </div>
                                      </div>
                                      <div style="font-weight: 600;">$${Number(item.lineTotal).toFixed(2)}</div>
                                    </li>
                                  `,
                                )}
                              </ul>
                            </article>
                          </md-card>
                        </li>
                      `,
                    )}
                  </ul>
                `
        }
      </div>
    `
  }
}

customElements.define('orders-page', OrdersPage)
