import { LitElement, html, css } from 'lit'
import 'material/text/text-field.js'
import 'material/buttons/button.js'
import 'material/buttons/icon-button.js'
import 'material/card/card.js'
import 'material/icon/icon.js'
import 'material/divider/divider.js'
import { snack } from 'material/snackbar/snackbar.js'
import '/components/confirm-dialog.js'
import { styles } from '/css/styles.js'
import { api } from 'api'

let lastAnnouncedCopyMessage = ''

export class ApiKeysCard extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
        width: 100%;
      }
      .settings-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .key-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-radius: 8px;
        background: var(--md-sys-color-surface-container, rgba(0, 0, 0, 0.04));
        border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
        gap: 12px;
      }
      .key-info {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .key-icon {
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
      .badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        background: var(--md-sys-color-secondary-container, #e8def8);
        color: var(--md-sys-color-on-secondary-container, #1d192b);
        font-weight: 500;
        display: inline-block;
      }
      .mono-badge {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .new-key-callout {
        padding: 16px;
        border-radius: 10px;
        background: #f0fdf4;
        border: 1px solid #86efac;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .new-key-value {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 13px;
        font-weight: 600;
        color: #14532d;
        word-break: break-all;
        background: #ffffff;
        padding: 10px 12px;
        border-radius: 6px;
        border: 1px solid #bbf7d0;
      }
      .mcp-snippet {
        margin: 0;
        padding: 12px 14px;
        border-radius: 8px;
        background: var(--md-sys-color-surface-container-highest, #ece6f0);
        color: var(--md-sys-color-on-surface, #1d1b20);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        line-height: 1.5;
        overflow-x: auto;
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
      .copy-wrap {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .copy-status {
        font-size: 12px;
        font-weight: 500;
        color: var(--md-sys-color-primary, #6750a4);
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .copy-status.visible {
        opacity: 1;
      }
      .copy-status.failed {
        color: var(--md-sys-color-error, #ba1a1a);
      }
      @media (prefers-reduced-motion: reduce) {
        .copy-status {
          transition: opacity 0.05s linear;
        }
      }
      md-icon-button.error {
        --md-icon-button-icon-color: var(--error-color, var(--md-sys-color-error, #ba1a1a));
      }
    `,
  ]

  static properties = {
    apiKeys: { type: Array },
    loading: { type: Boolean },
    creating: { type: Boolean },
    message: { type: Object },
    newlyCreatedKey: { type: String },
    copyStates: { type: Object },
  }

  constructor() {
    super()
    this.apiKeys = []
    this.loading = false
    this.creating = false
    this.message = null
    this.newlyCreatedKey = ''
    this.copyStates = {}
    this._copyTimers = new Map()
  }

  connectedCallback() {
    super.connectedCallback()
    this.fetchApiKeys()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    for (const timer of this._copyTimers.values()) {
      clearTimeout(timer)
    }
    this._copyTimers.clear()
  }

  get mcpEndpoint() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8787'
    return `${origin}/mcp`
  }

  get mcpConfigSnippet() {
    const tokenPlaceholder = this.newlyCreatedKey || 'YOUR_API_KEY'
    return JSON.stringify(
      {
        mcpServers: {
          flaregun: {
            url: this.mcpEndpoint,
            headers: {
              Authorization: `Bearer ${tokenPlaceholder}`,
            },
          },
        },
      },
      null,
      2,
    )
  }

  async fetchApiKeys() {
    this.loading = true
    try {
      const res = await api('/v1/apiKeys')
      this.apiKeys = res?.apiKeys || []
    } catch (err) {
      console.error('Failed to fetch API keys', err)
    } finally {
      this.loading = false
    }
  }

  async createApiKey() {
    const nameField = this.renderRoot.querySelector('#api-key-name-field')
    const name = nameField?.value?.trim() || 'MCP Agent Key'

    this.creating = true
    this.message = null
    try {
      const res = await api('/v1/apiKeys', {
        method: 'POST',
        body: { apiKey: { name } },
      })
      if (res?.apiKey?.key) {
        this.newlyCreatedKey = res.apiKey.key
      }
      if (nameField) {
        nameField.value = ''
      }
      this.message = { type: 'success', text: 'API key generated.' }
      await this.fetchApiKeys()
    } catch (err) {
      console.error('Failed to create API key', err)
      this.message = { type: 'error', text: err.message || 'Failed to generate API key' }
    } finally {
      this.creating = false
    }
  }

  async revokeApiKey(keyId, keyName) {
    const dialog = this.renderRoot.querySelector('#apiKeyConfirmDialog')
    const confirmed = await dialog.confirm({
      headline: 'Revoke API Key',
      message: `Are you sure you want to revoke "${keyName || 'API Key'}"? Any connected MCP agents using it will lose access immediately.`,
      confirmText: 'Revoke',
      destructive: true,
      icon: 'delete',
    })
    if (!confirmed) return

    this.message = null
    try {
      await api(`/v1/apiKeys/${keyId}`, {
        method: 'DELETE',
      })
      this.message = { type: 'success', text: 'API key revoked.' }
      snack('API key revoked')
      await this.fetchApiKeys()
    } catch (err) {
      console.error('Failed to revoke API key', err)
      this.message = { type: 'error', text: err.message || 'Failed to revoke API key' }
    }
  }

  async copyValue(slotKey, text) {
    if (!text) return
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      ok = false
    }

    clearTimeout(this._copyTimers.get(slotKey))
    let statusMessage = ok ? 'Copied' : 'Copy failed'
    if (statusMessage === lastAnnouncedCopyMessage) {
      statusMessage += '\u00A0'
    }
    lastAnnouncedCopyMessage = statusMessage

    this.copyStates = {
      ...this.copyStates,
      [slotKey]: { ok, failed: !ok, message: statusMessage },
    }

    const timer = setTimeout(() => {
      const next = { ...this.copyStates }
      delete next[slotKey]
      this.copyStates = next
      this._copyTimers.delete(slotKey)
    }, 2000)
    this._copyTimers.set(slotKey, timer)
  }

  render() {
    const keyCopyState = this.copyStates.newKey
    const configCopyState = this.copyStates.mcpConfig

    return html`
      <confirm-dialog id="apiKeyConfirmDialog"></confirm-dialog>

      <md-card class="p24 w100" style="box-sizing: border-box;">
        <div class="settings-section">
          <div>
            <div class="title-large flex aic g8">
              <md-icon style="color: var(--md-sys-color-primary, #6750a4);">smart_toy</md-icon>
              <span>MCP &amp; API Keys</span>
            </div>
            <div class="text-muted small mt4">
              Connect AI agents (Antigravity, Cursor, Claude Code, Windsurf) to your built-in Model Context Protocol
              endpoint at <code>${this.mcpEndpoint}</code>.
            </div>
          </div>

          ${
            this.message ? html`<div class="feedback-msg feedback-${this.message.type}">${this.message.text}</div>` : ''
          }
          ${
            this.newlyCreatedKey
              ? html`
                  <div class="new-key-callout">
                    <div class="flex jcsb aic flexw g8">
                      <span style="font-weight: 700; color: #166534; font-size: 13px;">
                        New API Key (Copy Now — Shown Once)
                      </span>
                      <span class="copy-wrap">
                        <md-button
                          type="button"
                          size="small"
                          @click=${() => this.copyValue('newKey', this.newlyCreatedKey)}>
                          <md-icon slot="icon" aria-hidden="true"
                            >${keyCopyState?.ok ? 'check' : 'content_copy'}</md-icon
                          >
                          Copy Key
                        </md-button>
                        <span
                          class="copy-status ${keyCopyState ? 'visible' : ''} ${keyCopyState?.failed ? 'failed' : ''}"
                          role="status"
                          >${keyCopyState?.message || ''}</span
                        >
                      </span>
                    </div>
                    <div class="new-key-value" id="newly-created-key-value">${this.newlyCreatedKey}</div>
                  </div>
                `
              : ''
          }

          <form
            class="flex aic g8 flexw mt4"
            @submit=${(e) => {
              e.preventDefault()
              this.createApiKey()
            }}>
            <md-text-field
              id="api-key-name-field"
              label="Key Name"
              placeholder="e.g. Antigravity, Cursor, Claude Code"
              style="flex: 1; min-width: 220px;"></md-text-field>
            <md-button type="button" @click=${this.createApiKey} ?disabled=${this.creating}>
              <md-icon slot="icon" aria-hidden="true">add</md-icon>
              ${this.creating ? 'Generating...' : 'Generate Key'}
            </md-button>
          </form>

          <div class="flex col g12 mt4">
            ${
              this.loading
                ? html`<div class="text-muted p16 text-center">Loading API keys...</div>`
                : this.apiKeys.length === 0
                  ? html`
                      <div
                        class="text-muted p16 text-center"
                        style="background: var(--md-sys-color-surface-container, rgba(0,0,0,0.02)); border-radius: 8px;">
                        No API keys generated yet. Create one above to connect an MCP client or call API endpoints.
                      </div>
                    `
                  : this.apiKeys.map(
                      (k) => html`
                        <div class="key-item">
                          <div class="key-info">
                            <div class="key-icon">
                              <md-icon>key</md-icon>
                            </div>
                            <div class="flex col g4">
                              <div style="font-weight: 500; font-size: 14px;">${k.name || 'API Key'}</div>
                              <div class="flex g8 aic flexw">
                                <span class="badge mono-badge">${k.maskedKey}</span>
                                ${
                                  k.lastUsedAt
                                    ? html`<span class="text-muted small"
                                        >Last used ${new Date(k.lastUsedAt).toLocaleDateString()}</span
                                      >`
                                    : html`<span class="text-muted small">Never used</span>`
                                }
                                ${
                                  k.createdAt
                                    ? html`<span class="text-muted small"
                                        >Created ${new Date(k.createdAt).toLocaleDateString()}</span
                                      >`
                                    : ''
                                }
                              </div>
                            </div>
                          </div>
                          <md-icon-button
                            class="error"
                            title="Revoke API Key"
                            aria-label="Revoke API key ${k.name || ''}"
                            @click=${() => this.revokeApiKey(k.id, k.name)}>
                            <md-icon>delete</md-icon>
                          </md-icon-button>
                        </div>
                      `,
                    )
            }
          </div>

          <md-divider class="mt4 mb4"></md-divider>

          <div class="flex col g8">
            <div class="flex jcsb aic flexw g8">
              <div style="font-weight: 600; font-size: 14px;">MCP Client Configuration</div>
              <span class="copy-wrap">
                <md-button
                  type="button"
                  color="outlined"
                  size="small"
                  @click=${() => this.copyValue('mcpConfig', this.mcpConfigSnippet)}>
                  <md-icon slot="icon" aria-hidden="true">${configCopyState?.ok ? 'check' : 'content_copy'}</md-icon>
                  Copy Config
                </md-button>
                <span
                  class="copy-status ${configCopyState ? 'visible' : ''} ${configCopyState?.failed ? 'failed' : ''}"
                  role="status"
                  >${configCopyState?.message || ''}</span
                >
              </span>
            </div>
            <pre class="mcp-snippet"><code>${this.mcpConfigSnippet}</code></pre>
          </div>
        </div>
      </md-card>
    `
  }
}

customElements.define('api-keys-card', ApiKeysCard)
