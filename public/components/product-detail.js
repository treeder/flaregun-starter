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
import '/components/product-reviews.js'
import { addToCart } from '/components/cart-drawer.js'
import { styles } from '/css/styles.js'
import { api } from 'api'
import state from 'state'

export class ProductDetail extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
      }
      .detail-hero-card {
        container-type: inline-size;
        overflow: hidden;
      }
      .detail-article {
        display: grid;
        grid-template-columns: 1fr;
      }
      .detail-article > img {
        inline-size: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        display: block;
        background: var(--md-sys-color-surface-container, #f3edf7);
      }
      @container (min-width: 680px) {
        .detail-article:has(> img) {
          grid-template-columns: minmax(280px, 1fr) 1.15fr;
          align-items: stretch;
        }
        .detail-article:has(> img) > img {
          aspect-ratio: 4 / 3;
          block-size: 100%;
          border-inline-end: 1px solid var(--md-sys-color-outline-variant, #ece6f0);
        }
      }
      .detail-info {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
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
      .draft-badge {
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 16px;
        background: #fff3e0;
        color: #e65100;
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
      .rating-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 600;
        color: #b45309;
        background: #fef3c7;
        padding: 4px 10px;
        border-radius: 16px;
      }
      .rating-pill md-icon {
        font-size: 16px;
      }
      .seller-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        color: var(--md-sys-color-on-surface-variant);
      }
      .seller-avatar {
        inline-size: 26px;
        block-size: 26px;
        border-radius: 50%;
        object-fit: cover;
        background: var(--md-sys-color-primary-container, #eaddff);
        color: var(--md-sys-color-on-primary-container, #21005d);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
      }
      .qty-stepper {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid var(--md-sys-color-outline-variant, #d0c9d6);
        border-radius: 999px;
        padding-inline: 4px;
      }
      md-dialog {
        --md-dialog-container-min-width: min(540px, 94dvw);
      }
    `,
  ]

  static properties = {
    product: { type: Object },
    user: { type: Object },
    canManage: { type: Boolean, attribute: 'can-manage' },
    quantity: { type: Number },
    addingToCart: { type: Boolean },
  }

  constructor() {
    super()
    this.product = {}
    this.user = {}
    this.canManage = false
    this.quantity = 1
    this.addingToCart = false
  }

  connectedCallback() {
    super.connectedCallback()
    this.checkAuth()
  }

  async checkAuth() {
    if (!this.isLoggedIn() && typeof document !== 'undefined' && /(?:^|;\s*)session=/.test(document.cookie)) {
      try {
        const res = await api('/v1/users/me')
        if (res?.user) {
          this.user = res.user
          const p = this.getProduct()
          this.canManage = Boolean(p.userId && p.userId === res.user.id)
        }
      } catch {}
    }
  }

  getProduct() {
    if (typeof this.product === 'string') {
      if (!this.product) return {}
      try {
        return JSON.parse(this.product)
      } catch {
        return {}
      }
    }
    return this.product || {}
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

  canManageProduct() {
    const p = this.getProduct()
    const u = this.getUser()
    if (this.canManage) return true
    return Boolean(u.id && p.userId && u.id === p.userId)
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

  handleReviewsUpdated(e) {
    const p = this.getProduct()
    if (p?.id && e.detail) {
      this.product = {
        ...p,
        data: {
          ...(p.data || {}),
          ratingAvg: e.detail.ratingAvg,
          ratingCount: e.detail.ratingCount,
        },
      }
    }
  }

  async handleAddToCart() {
    const p = this.getProduct()
    if (!p?.id || this.addingToCart) return
    this.addingToCart = true
    try {
      await addToCart(p.id, this.quantity, p.name)
    } catch (err) {
      snack(err.message || 'Failed to add to cart', { showCloseIcon: true })
    } finally {
      this.addingToCart = false
    }
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
    const u = this.getUser()
    const canEdit = this.canManageProduct()

    if (!p || !p.id) {
      return html`
        <md-card class="p24 text-center">
          <div class="flex col aic g16">
            <h1 class="headline-small" style="margin: 0;">Product Not Found</h1>
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

    const stockCount = typeof p.data?.stockCount === 'number' ? Math.max(0, Math.floor(p.data.stockCount)) : null
    const isOutOfStock = p.data?.inStock === false || (stockCount !== null && stockCount <= 0)
    const discount = Math.min(Math.max(Number(p.data?.discount) || 0, 0), 99)
    const basePrice = Math.max(0, Number(p.price) || 0)
    const finalPrice = Math.round(basePrice * (1 - discount / 100) * 100) / 100
    const category = p.data?.category
    const ratingAvg = Number(p.data?.ratingAvg) || 0
    const ratingCount = Number(p.data?.ratingCount) || 0
    const isDraft = p.status === 'draft' || p.data?.published === false
    const maxQty = stockCount !== null && stockCount > 0 ? Math.min(99, stockCount) : 99

    return html`
      <confirm-dialog id="confirmDialog"></confirm-dialog>

      ${
        canEdit
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
          : ''
      }

      <div class="flex col g24">
        <div class="flex aic jcsb flexw g12">
          <a href="/products">
            <md-button color="text">
              <md-icon slot="icon">arrow_back</md-icon>
              Back to Marketplace
            </md-button>
          </a>

          ${
            canEdit
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
              : ''
          }
        </div>

        <md-card class="detail-hero-card">
          <article class="detail-article">
            ${p.image ? html`<img src="${p.image}" alt="${p.name}" />` : ''}

            <div class="detail-info">
              <header class="flex col g8">
                <div class="flex g8 aic flexw">
                  ${category ? html`<span class="category-tag">${category}</span>` : ''}
                  <span class="stock-tag ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                    ${isOutOfStock ? 'Out of stock' : stockCount !== null ? `${stockCount} in stock` : 'In stock'}
                  </span>
                  ${discount > 0 ? html`<span class="sale-badge">${discount}% OFF</span>` : ''}
                  ${isDraft ? html`<span class="draft-badge">Private Draft</span>` : ''}
                  ${
                    ratingCount > 0
                      ? html`
                          <span class="rating-pill">
                            <md-icon aria-hidden="true">star</md-icon>
                            ${ratingAvg.toFixed(1)} (${ratingCount} review${ratingCount === 1 ? '' : 's'})
                          </span>
                        `
                      : ''
                  }
                </div>

                <h1
                  class="display-medium mt8"
                  style="margin-bottom: 0; font-size: 2rem; line-height: 2.4rem; font-weight: 700;">
                  ${p.name}
                </h1>

                ${
                  p.seller?.id
                    ? html`
                        <div class="seller-chip">
                          ${
                            p.seller.image
                              ? html`<img src="${p.seller.image}" alt="" class="seller-avatar" />`
                              : html`<span class="seller-avatar" aria-hidden="true">
                                  ${(p.seller.name || 'S').charAt(0).toUpperCase()}
                                </span>`
                          }
                          <span>Sold by <strong>${p.seller.name}</strong></span>
                        </div>
                      `
                    : html`
                        <div class="seller-chip">
                          <md-icon style="font-size: 18px; color: var(--md-sys-color-primary);">verified</md-icon>
                          <span>Sold by <strong>Flaregun Official Store</strong></span>
                        </div>
                      `
                }
              </header>

              <div class="flex aic g12 flexw">
                <span style="font-weight: 700; font-size: 1.85rem; color: var(--md-sys-color-primary);">
                  $${finalPrice.toFixed(2)}
                </span>
                ${
                  discount > 0
                    ? html`
                        <span
                          style="text-decoration: line-through; color: var(--md-sys-color-outline); font-size: 1.15rem;">
                          $${basePrice.toFixed(2)}
                        </span>
                      `
                    : ''
                }
              </div>

              <md-divider></md-divider>

              <div class="flex col g8">
                <h2 class="title-medium" style="margin: 0;">Description</h2>
                <p
                  style="margin: 0; color: var(--md-sys-color-on-surface-variant); line-height: 1.65; font-size: 1rem;">
                  ${p.description || 'No description provided.'}
                </p>
              </div>

              <footer class="flex aic g12 flexw mt8">
                ${
                  !isOutOfStock && !isDraft
                    ? html`
                        <div class="qty-stepper">
                          <md-icon-button
                            aria-label="Decrease quantity"
                            ?disabled=${this.quantity <= 1}
                            @click=${() => {
                              this.quantity = Math.max(1, this.quantity - 1)
                            }}>
                            <md-icon>remove</md-icon>
                          </md-icon-button>
                          <span style="min-inline-size: 28px; text-align: center; font-weight: 600;">
                            ${this.quantity}
                          </span>
                          <md-icon-button
                            aria-label="Increase quantity"
                            ?disabled=${this.quantity >= maxQty}
                            @click=${() => {
                              this.quantity = Math.min(maxQty, this.quantity + 1)
                            }}>
                            <md-icon>add</md-icon>
                          </md-icon-button>
                        </div>

                        <md-button
                          type="button"
                          color="filled"
                          ?disabled=${this.addingToCart}
                          @click=${this.handleAddToCart}>
                          <md-icon slot="icon">add_shopping_cart</md-icon>
                          ${
                            this.addingToCart
                              ? 'Adding...'
                              : `Add to Cart ($${(finalPrice * this.quantity).toFixed(2)})`
                          }
                        </md-button>
                      `
                    : html`
                        <md-button type="button" color="outlined" disabled>
                          <md-icon slot="icon">block</md-icon>
                          ${isDraft ? 'Draft (Not Publicly Purchasable)' : 'Currently Out of Stock'}
                        </md-button>
                      `
                }
              </footer>
            </div>
          </article>
        </md-card>

        <product-reviews
          product-id="${p.id}"
          .user=${u}
          @reviews-updated=${this.handleReviewsUpdated}></product-reviews>
      </div>
    `
  }
}

customElements.define('product-detail', ProductDetail)
