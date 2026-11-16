import { LitElement, html, css } from 'lit'
import 'material/buttons/button.js'
import 'material/buttons/icon-button.js'
import 'material/card/card.js'
import 'material/divider/divider.js'
import 'material/icon/icon.js'
import 'material/indicators/loading.js'
import 'material/indicators/progress.js'
import 'material/radio/radio.js'
import 'material/text/text-field.js'
import 'material/tooltip/tooltip.js'
import { snack } from 'material/snackbar/snackbar.js'
import '/components/confirm-dialog.js'
import { styles } from '/css/styles.js'
import { api } from 'api'
import state from 'state'

export class ProductReviews extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
      }
      .rating-fieldset {
        border: 1px solid var(--md-sys-color-outline-variant, #d0c9d6);
        border-radius: 10px;
        padding: 10px 14px 12px;
        margin: 0;
      }
      .rating-fieldset legend {
        font-weight: 600;
        font-size: 0.9rem;
        padding-inline: 6px;
        color: var(--md-sys-color-on-surface);
      }
      .rating-options {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        align-items: center;
      }
      .rating-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-weight: 500;
        padding-block: 4px;
      }
      .stars-inline {
        display: inline-flex;
        align-items: center;
        color: #d97706;
      }
      .stars-inline md-icon {
        font-size: 18px;
      }
      .reviews-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .author-avatar {
        inline-size: 32px;
        block-size: 32px;
        border-radius: 50%;
        object-fit: cover;
        background: var(--md-sys-color-primary-container, #eaddff);
        color: var(--md-sys-color-on-primary-container, #21005d);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        flex-shrink: 0;
      }
    `,
  ]

  static properties = {
    productId: { type: String, attribute: 'product-id' },
    user: { type: Object },
    reviews: { type: Array },
    summary: { type: Object },
    loading: { type: Boolean },
    submitting: { type: Boolean },
    selectedRating: { type: Number },
  }

  constructor() {
    super()
    this.productId = ''
    this.user = {}
    this.reviews = []
    this.summary = { ratingAvg: 0, ratingCount: 0 }
    this.loading = true
    this.submitting = false
    this.selectedRating = 5
  }

  updated(changed) {
    if (changed.has('productId') && this.productId) {
      this.fetchReviews()
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
    return Boolean(u.id || u.email)
  }

  async fetchReviews() {
    if (!this.productId) return
    this.loading = true
    try {
      const res = await api(`/v1/products/${this.productId}/reviews`)
      this.reviews = res?.reviews || []
      this.summary = res?.summary || { ratingAvg: 0, ratingCount: this.reviews.length }

      const u = this.getUser()
      const mine = u?.id ? this.reviews.find((r) => r.userId === u.id) : null
      if (mine) {
        this.selectedRating = Number(mine.rating) || 5
      }
    } catch (err) {
      console.error('Failed to load reviews', err)
    } finally {
      this.loading = false
    }
  }

  async submitReview(e) {
    e.preventDefault()
    if (this.submitting || !this.productId) return

    const titleEl = this.renderRoot.getElementById('review-title')
    const bodyEl = this.renderRoot.getElementById('review-body')

    this.submitting = true
    try {
      const res = await fetch(`/v1/products/${this.productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review: {
            rating: this.selectedRating,
            title: titleEl?.value || '',
            body: bodyEl?.value || '',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit review')
      }

      if (titleEl) titleEl.value = ''
      if (bodyEl) bodyEl.value = ''
      snack(data.updatedExisting ? 'Review updated!' : 'Review posted!', { showCloseIcon: true })
      await this.fetchReviews()
      this.dispatchEvent(new CustomEvent('reviews-updated', { detail: data.summary, bubbles: true, composed: true }))
    } catch (err) {
      snack(err.message || 'Failed to submit review', { showCloseIcon: true })
    } finally {
      this.submitting = false
    }
  }

  async deleteReview(review) {
    const dialog = this.renderRoot.querySelector('#reviewConfirmDialog')
    const confirmed = await dialog.confirm({
      headline: 'Delete Review',
      message: 'Are you sure you want to delete your review?',
      confirmText: 'Delete',
      destructive: true,
      icon: 'delete',
    })
    if (!confirmed) return

    try {
      const res = await fetch(`/v1/reviews/${review.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to delete review')
      }
      snack('Review deleted', { showCloseIcon: true })
      await this.fetchReviews()
      this.dispatchEvent(new CustomEvent('reviews-updated', { detail: data.summary, bubbles: true, composed: true }))
    } catch (err) {
      snack(err.message || 'Failed to delete review', { showCloseIcon: true })
    }
  }

  renderStars(rating) {
    const rounded = Math.round(Number(rating) || 0)
    return html`
      <span class="stars-inline" aria-label="${rating} out of 5 stars">
        ${[1, 2, 3, 4, 5].map(
          (n) => html`<md-icon aria-hidden="true">${n <= rounded ? 'star' : 'star_border'}</md-icon>`,
        )}
      </span>
    `
  }

  render() {
    const loggedIn = this.isLoggedIn()
    const u = this.getUser()
    const existingMine = u?.id ? this.reviews.find((r) => r.userId === u.id) : null

    return html`
      <confirm-dialog id="reviewConfirmDialog"></confirm-dialog>

      <div class="flex col g20">
        <div class="flex jcsb aic flexw g12">
          <div class="flex col g4">
            <h2 class="headline-small" style="margin: 0; font-weight: 600;">Customer Reviews</h2>
            <div class="flex aic g8 flexw">
              ${
                this.summary.ratingCount > 0
                  ? html`
                      ${this.renderStars(this.summary.ratingAvg)}
                      <span style="font-weight: 700;">${Number(this.summary.ratingAvg).toFixed(1)} out of 5</span>
                      <span class="text-muted"
                        >(${this.summary.ratingCount} review${this.summary.ratingCount === 1 ? '' : 's'})</span
                      >
                    `
                  : html`<span class="text-muted">No reviews yet. Be the first to share your thoughts!</span>`
              }
            </div>
          </div>

          ${
            !loggedIn
              ? html`
                  <a href="/signin?redirect=/products/${this.productId}">
                    <md-button color="tonal">
                      <md-icon slot="icon">rate_review</md-icon>
                      Sign in to Write a Review
                    </md-button>
                  </a>
                `
              : ''
          }
        </div>

        ${
          loggedIn
            ? html`
                <md-card class="p20">
                  <form
                    id="review-form"
                    class="flex col g16"
                    aria-labelledby="review-form-heading"
                    @submit=${this.submitReview}>
                    <h3 id="review-form-heading" class="title-medium" style="margin: 0;">
                      ${existingMine ? 'Update Your Review' : 'Write a Review'}
                    </h3>

                    <fieldset class="rating-fieldset">
                      <legend>Your Rating <span aria-hidden="true">*</span></legend>
                      <div class="rating-options">
                        ${[5, 4, 3, 2, 1].map(
                          (stars) => html`
                            <label class="rating-label" for="rating-${stars}">
                              <md-radio
                                id="rating-${stars}"
                                name="rating"
                                value="${stars}"
                                ?checked=${this.selectedRating === stars}
                                @change=${() => {
                                  this.selectedRating = stars
                                }}></md-radio>
                              <span>${stars} ${stars === 1 ? 'Star' : 'Stars'}</span>
                            </label>
                          `,
                        )}
                      </div>
                    </fieldset>

                    <md-text-field
                      id="review-title"
                      name="title"
                      label="Review headline"
                      value="${existingMine?.title || ''}"
                      placeholder="Summarize your experience"></md-text-field>

                    <md-text-field
                      id="review-body"
                      name="body"
                      type="textarea"
                      rows="3"
                      label="Review comment"
                      value="${existingMine?.body || ''}"
                      placeholder="What stood out about build quality, value, or usability?"></md-text-field>

                    ${this.submitting ? html`<md-progress type="linear" indeterminate shape="wavy"></md-progress>` : ''}

                    <div class="flex jce">
                      <md-button type="submit" color="filled" ?disabled=${this.submitting}>
                        <md-icon slot="icon">send</md-icon>
                        ${this.submitting ? 'Submitting...' : existingMine ? 'Update Review' : 'Post Review'}
                      </md-button>
                    </div>
                  </form>
                </md-card>
              `
            : ''
        }
        ${
          this.loading
            ? html`
                <div class="flex aic jcc p24 g12">
                  <md-loading size="36" contained></md-loading>
                  <span class="text-muted">Loading reviews...</span>
                </div>
              `
            : this.reviews.length > 0
              ? html`
                  <ul class="reviews-list" role="list">
                    ${this.reviews.map((rev) => {
                      const authorName = rev.author?.name || rev.reviewerName || 'Verified Shopper'
                      const initial = authorName.charAt(0).toUpperCase()
                      const isMine = Boolean(u?.id && rev.userId && u.id === rev.userId)

                      return html`
                        <li>
                          <md-card class="p16">
                            <article class="flex col g8">
                              <header class="flex jcsb aic g8 flexw">
                                <div class="flex aic g8">
                                  ${
                                    rev.author?.image
                                      ? html`<img
                                          src="${rev.author.image}"
                                          alt=""
                                          class="author-avatar"
                                          loading="lazy" />`
                                      : html`<span class="author-avatar" aria-hidden="true">${initial}</span>`
                                  }
                                  <div class="flex col">
                                    <span style="font-weight: 600;">${authorName}</span>
                                    <span class="text-muted small">
                                      ${rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
                                    </span>
                                  </div>
                                </div>

                                <div class="flex aic g8">
                                  ${this.renderStars(rev.rating)}
                                  ${
                                    isMine
                                      ? html`
                                          <md-tooltip text="Delete your review">
                                            <md-icon-button
                                              class="error"
                                              aria-label="Delete review by ${authorName}"
                                              @click=${() => this.deleteReview(rev)}>
                                              <md-icon>delete</md-icon>
                                            </md-icon-button>
                                          </md-tooltip>
                                        `
                                      : ''
                                  }
                                </div>
                              </header>

                              ${rev.title ? html`<h3 class="title-medium" style="margin: 4px 0 0;">${rev.title}</h3>` : ''}
                              ${
                                rev.body
                                  ? html`<p
                                      style="margin: 0; color: var(--md-sys-color-on-surface-variant); line-height: 1.55;">
                                      ${rev.body}
                                    </p>`
                                  : ''
                              }
                            </article>
                          </md-card>
                        </li>
                      `
                    })}
                  </ul>
                `
              : ''
        }
      </div>
    `
  }
}

customElements.define('product-reviews', ProductReviews)
