import { LitElement, html, css } from 'lit'
import 'material/buttons/button.js'
import 'material/buttons/icon-button.js'
import 'material/icon/icon.js'
import 'material/badge/badge.js'
import 'material/dialog/dialog.js'
import 'material/divider/divider.js'
import 'material/text/text-field.js'
import 'material/tooltip/tooltip.js'
import 'material/indicators/progress.js'
import { snack } from 'material/snackbar/snackbar.js'
import { styles } from '/css/styles.js'
import { api } from 'api'
import state from 'state'

export async function addToCart(productId, quantity = 1, productName = 'Item') {
  const res = await fetch('/v1/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity, mode: 'add' }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to add item to cart')
  }
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: data.cart }))
  snack(`Added "${productName}" to cart`, {
    showCloseIcon: true,
    action: {
      label: 'View Cart',
      onClick: () => window.dispatchEvent(new CustomEvent('cart-open')),
    },
  })
  return data.cart
}

export class CartButton extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
      }
      .cart-trigger-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
      }
      md-badge {
        position: absolute;
        inset-block-start: 2px;
        inset-inline-end: 2px;
        pointer-events: none;
      }
      md-dialog {
        --md-dialog-container-min-width: min(560px, 94dvw);
        --md-dialog-container-max-width: min(620px, 96dvw);
      }
      .cart-dialog-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-block-size: 72dvh;
        overflow-y: auto;
        padding-block: 4px;
      }
      .cart-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .cart-item {
        display: grid;
        grid-template-columns: 64px 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 12px;
        border-radius: 12px;
        background: var(--md-sys-color-surface-container, rgba(0, 0, 0, 0.03));
        border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      }
      @media (width < 520px) {
        .cart-item {
          grid-template-columns: 52px 1fr;
        }
        .cart-item-actions {
          grid-column: 1 / -1;
          justify-content: space-between;
        }
      }
      .cart-thumb {
        inline-size: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 8px;
        background: var(--md-sys-color-surface-container-high, #ece6f0);
      }
      .cart-thumb-placeholder {
        inline-size: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--md-sys-color-surface-container-high, #ece6f0);
        color: var(--md-sys-color-on-surface-variant, #49454f);
      }
      .qty-controls {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant, #d0c9d6);
        padding-inline: 2px;
      }
      .qty-value {
        min-inline-size: 24px;
        text-align: center;
        font-weight: 600;
        font-size: 0.95rem;
      }
      .summary-box {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 14px 16px;
        border-radius: 12px;
        background: var(--md-sys-color-surface-container-low, rgba(0, 0, 0, 0.02));
        border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.95rem;
      }
      .summary-total {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--md-sys-color-on-surface);
      }
      .confirmation-banner {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 12px;
        padding: 20px 16px;
        border-radius: 16px;
        background: var(--md-sys-color-secondary-container, #e8def8);
        color: var(--md-sys-color-on-secondary-container, #1d192b);
      }
      .error-banner {
        padding: 10px 12px;
        border-radius: 8px;
        background: #ffebee;
        color: #c62828;
        font-size: 0.9rem;
      }
    `,
  ]

  static properties = {
    user: { type: Object },
    cart: { type: Object },
    loading: { type: Boolean },
    checkingOut: { type: Boolean },
    showCheckoutForm: { type: Boolean },
    completedOrder: { type: Object },
    checkoutError: { type: String },
  }

  constructor() {
    super()
    this.user = {}
    this.cart = { items: [], itemCount: 0, subtotal: 0, discountTotal: 0, total: 0 }
    this.loading = false
    this.checkingOut = false
    this.showCheckoutForm = false
    this.completedOrder = null
    this.checkoutError = ''

    this._onCartUpdated = (e) => {
      if (e.detail) {
        this.cart = e.detail
      } else {
        this.fetchCart()
      }
    }
    this._onCartOpen = () => this.openCart()
    this._onUserChange = (e) => {
      this.user = e.detail?.value || {}
      this.fetchCart()
    }
  }

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener('cart-updated', this._onCartUpdated)
    window.addEventListener('cart-open', this._onCartOpen)
    state.addEventListener('user', this._onUserChange)
    this.fetchCart()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('cart-updated', this._onCartUpdated)
    window.removeEventListener('cart-open', this._onCartOpen)
    state.removeEventListener('user', this._onUserChange)
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

  async fetchCart() {
    this.loading = true
    try {
      const res = await api('/v1/cart')
      if (res?.cart) {
        this.cart = res.cart
      }
    } catch (err) {
      console.error('Failed to load cart', err)
    } finally {
      this.loading = false
    }
  }

  openCart() {
    this.completedOrder = null
    this.checkoutError = ''
    this.fetchCart()
    const dialog = this.renderRoot.querySelector('#cartDialog')
    if (dialog) dialog.show()
  }

  closeCart() {
    const dialog = this.renderRoot.querySelector('#cartDialog')
    if (dialog) dialog.close()
  }

  async changeQuantity(productId, nextQty) {
    try {
      const res = await fetch('/v1/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: nextQty }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Could not update quantity')
      }
      this.cart = data.cart
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: data.cart }))
    } catch (err) {
      snack(err.message || 'Failed to update cart', { showCloseIcon: true })
    }
  }

  async clearAll() {
    try {
      const res = await fetch('/v1/cart', { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.cart) {
        this.cart = data.cart
        this.showCheckoutForm = false
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: data.cart }))
      }
    } catch (err) {
      snack('Failed to clear cart', { showCloseIcon: true })
    }
  }

  async submitCheckout(e) {
    e.preventDefault()
    if (this.checkingOut) return

    const form = this.renderRoot.querySelector('#checkout-form')
    if (form && !form.reportValidity()) return

    const nameField = this.renderRoot.querySelector('#checkout-name')
    const addressField = this.renderRoot.querySelector('#checkout-address')
    const notesField = this.renderRoot.querySelector('#checkout-notes')

    const shippingAddress = addressField?.value?.trim() || ''
    if (!shippingAddress) {
      this.checkoutError = 'Please enter a shipping address to complete your order.'
      addressField?.focus()
      return
    }

    this.checkingOut = true
    this.checkoutError = ''
    try {
      const res = await fetch('/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            customerName: nameField?.value?.trim() || '',
            shippingAddress,
            notes: notesField?.value?.trim() || '',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Checkout failed')
      }

      this.completedOrder = data.order
      this.showCheckoutForm = false
      this.cart = { items: [], itemCount: 0, subtotal: 0, discountTotal: 0, total: 0 }
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: this.cart }))
      window.dispatchEvent(new CustomEvent('product-saved'))
      snack(`Order ${data.order.orderNumber} placed!`, { showCloseIcon: true })
    } catch (err) {
      this.checkoutError = err.message || 'Checkout failed'
    } finally {
      this.checkingOut = false
    }
  }

  render() {
    const count = Number(this.cart?.itemCount) || 0
    const items = this.cart?.items || []
    const loggedIn = this.isLoggedIn()
    const user = this.getUser()
    const redirectPath = typeof window !== 'undefined' ? window.location.pathname : '/products'

    return html`
      <div class="cart-trigger-wrap">
        <md-tooltip text="Shopping Cart">
          <md-icon-button
            aria-label=${count > 0 ? `Shopping cart, ${count} item${count === 1 ? '' : 's'}` : 'Shopping cart, empty'}
            @click=${this.openCart}>
            <md-icon>shopping_cart</md-icon>
          </md-icon-button>
        </md-tooltip>
        ${count > 0 ? html`<md-badge value="${count > 99 ? '99+' : String(count)}"></md-badge>` : ''}
      </div>

      <md-dialog id="cartDialog">
        <div slot="headline" class="flex aic jcsb w100 g8">
          <div class="flex aic g8">
            <md-icon>shopping_bag</md-icon>
            <span>${this.completedOrder ? 'Order Confirmed' : `Your Cart (${count})`}</span>
          </div>
        </div>

        <div slot="content" class="cart-dialog-body">
          ${
            this.completedOrder
              ? html`
                  <div class="confirmation-banner" role="status" aria-live="polite">
                    <md-icon style="font-size: 40px;">check_circle</md-icon>
                    <div class="title-large" style="font-weight: 700;">
                      Thank you, ${this.completedOrder.customerName}!
                    </div>
                    <div>
                      Order <strong>${this.completedOrder.orderNumber}</strong> for
                      <strong>$${Number(this.completedOrder.total).toFixed(2)}</strong> is confirmed. A receipt has been
                      sent to <strong>${this.completedOrder.customerEmail || 'your account email'}</strong>.
                    </div>
                    <div class="flex g8 flexw jcc mt8">
                      <a href="/orders">
                        <md-button color="filled">
                          <md-icon slot="icon">receipt_long</md-icon>
                          View My Orders
                        </md-button>
                      </a>
                      <md-button type="button" color="outlined" @click=${this.closeCart}>Continue Shopping</md-button>
                    </div>
                  </div>
                `
              : items.length === 0
                ? html`
                    <div class="flex col aic jcc p24 g12 text-center">
                      <md-icon style="font-size: 44px; color: var(--md-sys-color-outline);">shopping_cart</md-icon>
                      <div class="title-medium">Your cart is empty</div>
                      <div class="text-muted">
                        Browse the marketplace and add products to test KV cart persistence and checkout.
                      </div>
                    </div>
                  `
                : html`
                    <ul class="cart-list" role="list">
                      ${items.map(
                        (item) => html`
                          <li class="cart-item">
                            ${
                              item.image
                                ? html`<img src="${item.image}" alt="" class="cart-thumb" loading="lazy" />`
                                : html`<div class="cart-thumb-placeholder" aria-hidden="true">
                                    <md-icon>inventory_2</md-icon>
                                  </div>`
                            }

                            <div class="flex col g4" style="min-inline-size: 0;">
                              <a
                                href="/products/${item.productId}"
                                style="font-weight: 600; color: var(--md-sys-color-on-surface);"
                                @click=${this.closeCart}>
                                ${item.name}
                              </a>
                              <div class="flex aic g8 flexw small">
                                <span style="font-weight: 600; color: var(--md-sys-color-primary);">
                                  $${Number(item.finalUnitPrice).toFixed(2)}
                                </span>
                                ${
                                  item.discount > 0
                                    ? html`<span
                                        style="text-decoration: line-through; color: var(--md-sys-color-outline);">
                                        $${Number(item.unitPrice).toFixed(2)}
                                      </span>`
                                    : ''
                                }
                                <span class="text-muted">Line: $${Number(item.lineTotal).toFixed(2)}</span>
                              </div>
                            </div>

                            <div class="flex aic g4 cart-item-actions">
                              <div class="qty-controls">
                                <md-icon-button
                                  aria-label="Decrease quantity for ${item.name}"
                                  @click=${() => this.changeQuantity(item.productId, item.quantity - 1)}>
                                  <md-icon>remove</md-icon>
                                </md-icon-button>
                                <span class="qty-value">${item.quantity}</span>
                                <md-icon-button
                                  aria-label="Increase quantity for ${item.name}"
                                  ?disabled=${item.stockCount !== null && item.quantity >= item.stockCount}
                                  @click=${() => this.changeQuantity(item.productId, item.quantity + 1)}>
                                  <md-icon>add</md-icon>
                                </md-icon-button>
                              </div>
                              <md-icon-button
                                class="error"
                                aria-label="Remove ${item.name} from cart"
                                @click=${() => this.changeQuantity(item.productId, 0)}>
                                <md-icon>delete</md-icon>
                              </md-icon-button>
                            </div>
                          </li>
                        `,
                      )}
                    </ul>

                    <div class="summary-box">
                      <div class="summary-row">
                        <span class="text-muted">Subtotal</span>
                        <span>$${Number(this.cart.subtotal).toFixed(2)}</span>
                      </div>
                      ${
                        this.cart.discountTotal > 0
                          ? html`
                              <div class="summary-row success">
                                <span>Discounts</span>
                                <span>-$${Number(this.cart.discountTotal).toFixed(2)}</span>
                              </div>
                            `
                          : ''
                      }
                      <div class="summary-row">
                        <span class="text-muted">Shipping</span>
                        <span class="success">Free</span>
                      </div>
                      <md-divider></md-divider>
                      <div class="summary-row summary-total">
                        <span>Total</span>
                        <span>$${Number(this.cart.total).toFixed(2)} USD</span>
                      </div>
                    </div>

                    ${
                      loggedIn && this.showCheckoutForm
                        ? html`
                            <form
                              id="checkout-form"
                              class="flex col g12"
                              aria-label="Checkout details"
                              @submit=${this.submitCheckout}>
                              <div class="title-medium">Shipping Details (Demo Checkout)</div>

                              ${
                                this.checkoutError
                                  ? html`<div class="error-banner" role="alert">${this.checkoutError}</div>`
                                  : ''
                              }

                              <md-text-field
                                id="checkout-name"
                                name="customerName"
                                label="Full name *"
                                autocomplete="name"
                                required
                                value="${user.name || ''}"
                                @input=${() => {
                                  this.checkoutError = ''
                                }}></md-text-field>

                              <md-text-field
                                id="checkout-address"
                                name="shippingAddress"
                                type="textarea"
                                rows="2"
                                label="Shipping address *"
                                autocomplete="street-address"
                                required
                                placeholder="101 Townsend St, San Francisco, CA 94107"
                                @input=${() => {
                                  this.checkoutError = ''
                                }}></md-text-field>

                              <md-text-field
                                id="checkout-notes"
                                name="notes"
                                label="Delivery notes (optional)"
                                placeholder="Leave at front desk"></md-text-field>

                              ${
                                this.checkingOut
                                  ? html`<md-progress type="linear" indeterminate shape="wavy"></md-progress>`
                                  : ''
                              }

                              <div class="flex jce g8 mt8">
                                <md-button
                                  type="button"
                                  color="text"
                                  ?disabled=${this.checkingOut}
                                  @click=${() => {
                                    this.showCheckoutForm = false
                                  }}>
                                  Back
                                </md-button>
                                <md-button type="submit" color="filled" ?disabled=${this.checkingOut}>
                                  <md-icon slot="icon">lock</md-icon>
                                  ${
                                    this.checkingOut
                                      ? 'Placing Order...'
                                      : `Place Order ($${Number(this.cart.total).toFixed(2)})`
                                  }
                                </md-button>
                              </div>
                            </form>
                          `
                        : ''
                    }
                  `
          }
        </div>

        <div slot="actions" class="flex jcsb aic w100 flexw g8">
          ${
            items.length > 0 && !this.completedOrder
              ? html`
                  <md-button type="button" color="text" class="error" @click=${this.clearAll}>Clear Cart</md-button>
                `
              : html`<span></span>`
          }

          <div class="flex aic g8">
            ${
              !this.completedOrder
                ? html`<md-button type="button" color="text" @click=${this.closeCart}>Close</md-button>`
                : ''
            }
            ${
              items.length > 0 && !this.completedOrder && !this.showCheckoutForm
                ? loggedIn
                  ? html`
                      <md-button
                        type="button"
                        color="filled"
                        @click=${() => {
                          this.showCheckoutForm = true
                        }}>
                        <md-icon slot="icon">shopping_cart_checkout</md-icon>
                        Checkout ($${Number(this.cart.total).toFixed(2)})
                      </md-button>
                    `
                  : html`
                      <a href="/signin?redirect=${encodeURIComponent(redirectPath)}">
                        <md-button color="filled">
                          <md-icon slot="icon">login</md-icon>
                          Sign in to Checkout
                        </md-button>
                      </a>
                    `
                : ''
            }
          </div>
        </div>
      </md-dialog>
    `
  }
}

customElements.define('cart-button', CartButton)
