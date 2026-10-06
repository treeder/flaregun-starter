import { LitElement, html, css } from 'lit'
import 'material/text/text-field.js'
import 'material/buttons/button.js'
import 'material/buttons/icon-button.js'
import 'material/card/card.js'
import 'material/icon/icon.js'
import 'material/divider/divider.js'
import '/components/confirm-dialog.js'
import { styles } from '/css/styles.js'
import { api } from 'api'

export class FlagsPage extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
        width: 100%;
        max-width: 680px;
        margin: 0 auto;
      }
      .flags-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .flag-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-radius: 8px;
        background: var(--md-sys-color-surface-container, rgba(0, 0, 0, 0.04));
        border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      }
      .flag-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .flag-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--md-sys-color-primary-container, #eaddff);
        color: var(--md-sys-color-on-primary-container, #21005d);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .flag-name {
        font-family: monospace;
        font-size: 14px;
        font-weight: 600;
        color: var(--md-sys-color-on-surface, #1c1b1f);
        word-break: break-all;
      }
      .feedback-msg {
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
      }
      .feedback-success {
        background: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #c8e6c9;
      }
      .feedback-error {
        background: #ffebee;
        color: #c62828;
        border: 1px solid #ffcdd2;
      }
      md-icon-button.error {
        --md-icon-button-icon-color: var(--error-color, var(--md-sys-color-error, #ba1a1a));
      }
      .add-flag-form {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }
      .add-flag-form md-text-field {
        flex: 1;
        min-width: 240px;
      }
      .empty-state {
        padding: 24px 16px;
        text-align: center;
        background: var(--md-sys-color-surface-container, rgba(0, 0, 0, 0.02));
        border-radius: 8px;
        color: var(--md-sys-color-on-surface-variant, #757575);
      }
    `,
  ]

  static properties = {
    user: { type: Object },
    loading: { type: Boolean },
    message: { type: Object },
  }

  constructor() {
    super()
    this.user = {}
    this.loading = false
    this.message = null
  }

  async connectedCallback() {
    super.connectedCallback()
    this.initUser()
    if (!this.user?.id) {
      await this.fetchUser()
    }
  }

  initUser() {
    if (typeof this.user === 'string') {
      try {
        this.user = JSON.parse(this.user)
      } catch (e) {
        this.user = {}
      }
    }
  }

  async fetchUser() {
    try {
      const res = await api('/v1/users/me')
      if (res?.user) {
        this.user = {
          ...this.user,
          ...res.user,
        }
        this.requestUpdate()
      }
    } catch (e) {
      console.error('Failed to fetch user', e)
    }
  }

  get flags() {
    const rawFlags = this.user?.data?.flags
    if (rawFlags && typeof rawFlags === 'object' && !Array.isArray(rawFlags)) {
      return Object.keys(rawFlags).filter((k) => rawFlags[k])
    }
    if (Array.isArray(rawFlags)) {
      return rawFlags
    }
    if (typeof rawFlags === 'string') {
      try {
        const parsed = JSON.parse(rawFlags)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return Object.keys(parsed).filter((k) => parsed[k])
        }
        if (Array.isArray(parsed)) return parsed
      } catch (e) {}
    }
    return []
  }

  handleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      this.addFlag()
    }
  }

  async addFlag(e) {
    if (e) e.preventDefault()
    const input = this.renderRoot.querySelector('#new-flag-input')
    const flagName = (input?.value || '').trim()

    if (!flagName) {
      this.message = { type: 'error', text: 'Please enter a flag name.' }
      return
    }

    if (this.flags.includes(flagName)) {
      this.message = { type: 'error', text: `Flag "${flagName}" is already set.` }
      return
    }

    this.loading = true
    this.message = null

    try {
      const res = await api('/v1/users/me', {
        method: 'POST',
        body: {
          user: {
            data: {
              flags: {
                [flagName]: true,
              },
            },
          },
        },
      })

      if (res?.user) {
        this.user = res.user
      } else {
        const currentFlags =
          this.user?.data?.flags && typeof this.user.data.flags === 'object' && !Array.isArray(this.user.data.flags)
            ? { ...this.user.data.flags, [flagName]: true }
            : { [flagName]: true }
        this.user = {
          ...this.user,
          data: {
            ...(this.user?.data || {}),
            flags: currentFlags,
          },
        }
      }

      if (input) {
        input.value = ''
      }
      this.message = { type: 'success', text: `Flag "${flagName}" added.` }
    } catch (err) {
      console.error(err)
      this.message = { type: 'error', text: err.message || 'Failed to add flag' }
    } finally {
      this.loading = false
      this.requestUpdate()
    }
  }

  async deleteFlag(flagName) {
    const dialog = this.renderRoot.querySelector('#confirmDialog')
    if (dialog) {
      const confirmed = await dialog.confirm({
        headline: 'Remove Flag',
        message: `Are you sure you want to remove flag "${flagName}"?`,
        confirmText: 'Remove',
        destructive: true,
        icon: 'delete',
      })
      if (!confirmed) return
    }

    this.loading = true
    this.message = null

    try {
      const res = await api('/v1/users/me', {
        method: 'POST',
        body: {
          user: {
            data: {
              flags: {
                [flagName]: null,
              },
            },
          },
        },
      })

      if (res?.user) {
        this.user = res.user
      } else {
        const currentFlags =
          this.user?.data?.flags && typeof this.user.data.flags === 'object' ? { ...this.user.data.flags } : {}
        delete currentFlags[flagName]
        this.user = {
          ...this.user,
          data: {
            ...(this.user?.data || {}),
            flags: currentFlags,
          },
        }
      }

      this.message = { type: 'success', text: `Flag "${flagName}" removed.` }
    } catch (err) {
      console.error(err)
      this.message = { type: 'error', text: err.message || 'Failed to remove flag' }
    } finally {
      this.loading = false
      this.requestUpdate()
    }
  }

  render() {
    const flags = this.flags

    return html`
      <confirm-dialog id="confirmDialog"></confirm-dialog>

      <div class="flex col g24 w100">
        <div class="headline-medium">Feature Flags</div>

        <md-card class="p24 w100" style="box-sizing: border-box;">
          <div class="flags-section">
            <div class="title-large">User Flags</div>
            <div class="text-muted small">
              Manage custom feature flags for your user profile. These flags are stored in <code>user.data.flags</code>.
            </div>

            ${
              this.message
                ? html`<div class="feedback-msg feedback-${this.message.type}">${this.message.text}</div>`
                : ''
            }

            <form class="add-flag-form mt8" @submit=${this.addFlag}>
              <md-text-field
                id="new-flag-input"
                label="Flag name"
                placeholder="e.g. beta-feature"
                ?disabled=${this.loading}
                @keydown=${this.handleKeydown}>
              </md-text-field>
              <md-button type="button" ?disabled=${this.loading} @click=${this.addFlag}>
                <md-icon slot="icon">add</md-icon>
                Add Flag
              </md-button>
            </form>

            <md-divider class="mt8 mb8"></md-divider>

            <div class="title-medium mt8">Set Flags (${flags.length})</div>

            <div class="flex col g12">
              ${
                flags.length === 0
                  ? html`
                      <div class="empty-state">
                        No flags set yet. Enter a flag name above and click "Add Flag" to enable one.
                      </div>
                    `
                  : flags.map(
                      (flag) => html`
                        <div class="flag-item">
                          <div class="flag-info">
                            <div class="flag-icon">
                              <md-icon>flag</md-icon>
                            </div>
                            <span class="flag-name">${flag}</span>
                          </div>
                          <md-icon-button
                            class="error"
                            title="Delete Flag"
                            aria-label="Delete ${flag}"
                            ?disabled=${this.loading}
                            @click=${() => this.deleteFlag(flag)}>
                            <md-icon>delete</md-icon>
                          </md-icon-button>
                        </div>
                      `,
                    )
              }
            </div>
          </div>
        </md-card>
      </div>
    `
  }
}

customElements.define('flags-page', FlagsPage)
