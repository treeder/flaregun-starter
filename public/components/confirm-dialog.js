import { LitElement, html, css } from 'lit'
import 'material/dialog/dialog.js'
import 'material/buttons/button.js'
import 'material/icon/icon.js'
import { styles } from '/css/styles.js'

export class ConfirmDialog extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: contents;
      }
      md-button.error,
      md-button.destructive {
        --md-button-container-color: var(--error-color, var(--md-sys-color-error, #ba1a1a));
        --md-button-label-text-color: var(--md-sys-color-on-error, #ffffff);
        --md-sys-color-primary: var(--error-color, var(--md-sys-color-error, #ba1a1a));
        --md-sys-color-on-primary: var(--md-sys-color-on-error, #ffffff);
      }
      .dialog-icon {
        font-size: 28px;
      }
    `,
  ]

  static properties = {
    open: { type: Boolean, reflect: true },
    headline: { type: String },
    message: { type: String },
    confirmText: { type: String, attribute: 'confirm-text' },
    cancelText: { type: String, attribute: 'cancel-text' },
    destructive: { type: Boolean, reflect: true },
    icon: { type: String },
  }

  constructor() {
    super()
    this.open = false
    this.headline = 'Confirm'
    this.message = ''
    this.confirmText = 'Confirm'
    this.cancelText = 'Cancel'
    this.destructive = false
    this.icon = ''
    this._resolve = null
  }

  static async confirm(options = {}) {
    const dialog = document.createElement('confirm-dialog')
    document.body.appendChild(dialog)
    try {
      return await dialog.confirm(options)
    } finally {
      dialog.remove()
    }
  }

  _applyOptions(options = {}) {
    if (typeof options === 'string') {
      this.message = options
      return
    }
    if (options.headline !== undefined) this.headline = options.headline
    else if (options.title !== undefined) this.headline = options.title
    if (options.message !== undefined) this.message = options.message
    if (options.confirmText !== undefined) this.confirmText = options.confirmText
    if (options.cancelText !== undefined) this.cancelText = options.cancelText
    if (options.destructive !== undefined) this.destructive = options.destructive
    if (options.icon !== undefined) this.icon = options.icon
  }

  show(options = {}) {
    this._applyOptions(options)
    this.open = true
    return this
  }

  close(returnValue = '') {
    this.open = false
    const mdDialog = this.renderRoot?.querySelector('md-dialog')
    if (mdDialog?.open) {
      mdDialog.close(returnValue)
    }
  }

  confirm(options = {}) {
    this._applyOptions(options)
    this.open = true
    return new Promise((resolve) => {
      this._resolve = resolve
    })
  }

  _onConfirm() {
    this.open = false
    this.dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }))
    this.dispatchEvent(new CustomEvent('close', { detail: { action: 'confirm' }, bubbles: true, composed: true }))
    if (this._resolve) {
      const resolve = this._resolve
      this._resolve = null
      resolve(true)
    }
  }

  _onCancel() {
    this.open = false
    this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }))
    this.dispatchEvent(new CustomEvent('close', { detail: { action: 'cancel' }, bubbles: true, composed: true }))
    if (this._resolve) {
      const resolve = this._resolve
      this._resolve = null
      resolve(false)
    }
  }

  _handleClose(e) {
    this.open = false
    if (this._resolve) {
      const resolve = this._resolve
      this._resolve = null
      resolve(false)
    }
  }

  _handleCancel(e) {
    this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }))
    this._handleClose(e)
  }

  render() {
    return html`
      <md-dialog ?open=${this.open} @close=${this._handleClose} @cancel=${this._handleCancel}>
        ${
          this.icon
            ? html`<md-icon slot="icon" class="dialog-icon ${this.destructive ? 'error' : ''}">${this.icon}</md-icon>`
            : ''
        }
        <div slot="headline">
          <slot name="headline">${this.headline}</slot>
        </div>
        <div slot="content">
          <slot>${this.message}</slot>
        </div>
        <div slot="actions">
          <slot name="actions">
            <md-button color="text" @click=${this._onCancel}>${this.cancelText}</md-button>
            <md-button color="filled" class=${this.destructive ? 'error' : ''} @click=${this._onConfirm}>
              ${this.confirmText}
            </md-button>
          </slot>
        </div>
      </md-dialog>
    `
  }
}

customElements.define('confirm-dialog', ConfirmDialog)
