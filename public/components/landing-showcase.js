import { LitElement, html, css } from 'lit'
import 'material/tabs/tabs.js'
import 'material/tabs/tab.js'
import 'material/buttons/icon-button.js'
import 'material/buttons/button.js'
import 'material/icon/icon.js'
import 'material/tooltip/tooltip.js'
import { snack } from 'material/snackbar/snackbar.js'

export const SNIPPETS = [
  {
    id: 'edge-data',
    file: 'functions/v1/products/[id]/index.js',
    badge: 'D1 + KV + R2',
    raw: `import { Product } from '../../../data/products.js'

export async function onRequestPatch(c) {
  // Atomic SQLite RFC 7396 json_patch — no read-modify-write
  await c.data.d1.update(Product, c.params.id, {
    data: { inStock: true, featured: true },
  })

  const product = await c.data.d1.get(Product, c.params.id)
  await c.data.kv.putJSON(\`product:\${product.id}\`, product)
  return Response.json({ product })
}`,
    footerLabel: 'Zero-boilerplate bindings on c.data',
    footerLinkText: 'Browse Marketplace',
    footerHref: '/products',
    pills: ['D1 Models', 'JSON Merge Patch', 'Scoped KV', 'R2 Media'],
  },
  {
    id: 'mcp-agent',
    file: 'POST /mcp · JSON-RPC',
    badge: 'MCP Ready',
    raw: `// Connect Claude, Gemini, or Cursor with a scoped API key
POST /mcp HTTP/1.1
Authorization: Bearer fg_key_live_9x82k...
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "listProducts",
    "arguments": {
      "category": "electronics",
      "inStock": true
    }
  }
}`,
    footerLabel: 'Scoped read/write keys per user',
    footerLinkText: 'Manage API Keys',
    footerHref: '/settings',
    pills: ['Streamable HTTP', 'Stateless Discovery', 'Scoped Keys', 'Tool Auth'],
  },
  {
    id: 'ui-auth',
    file: 'functions/signin.js',
    badge: 'Passkeys + M3',
    raw: `import { html } from 'rend'

export const onRequestGet = (c) =>
  c.data.rend.html({
    title: 'Sign In',
    main: () => html\`
      <script type="module">
        import '/components/sign-in.js'
        import 'material/buttons/button.js'
      </script>
      <sign-in baseURL="/auth" afterLoginHref="/"></sign-in>
    \`,
  })`,
    footerLabel: 'Native import maps — no client bundle bloat',
    footerLinkText: 'Explore M3 Demo',
    footerHref: '/demo',
    pills: ['WebAuthn Passkeys', 'Magic Links', 'Material 3 ESM', 'SSR Slots'],
  },
]

const TOKEN_RE =
  /(\/\/[^\n]*)|(`[\s\S]*?`|'[^'\n]*'|Bearer\s+[^\n]+)|("[^"\n]*"(?=\s*:)|\b[a-zA-Z_$][\w$-]*(?=\s*:)|\/mcp\b)|("[^"\n]*")|(\b(?:import|from|export|async|function|const|await|return|true|false|POST)\b)|(\b[a-zA-Z_$][\w$]*(?=\s*\())/g

export function tokenizeCode(raw) {
  const tokens = []
  let lastIndex = 0
  for (const match of raw.matchAll(TOKEN_RE)) {
    if (match.index > lastIndex) {
      tokens.push({ cls: '', text: raw.slice(lastIndex, match.index) })
    }
    const cls = match[1] ? 'cmt' : match[2] || match[4] ? 'str' : match[3] ? 'prop' : match[5] ? 'kw' : 'fn'
    tokens.push({ cls, text: match[0] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < raw.length) {
    tokens.push({ cls: '', text: raw.slice(lastIndex) })
  }
  return tokens
}

export class CliCopyBar extends LitElement {
  static properties = {
    command: { type: String },
    copied: { type: Boolean, state: true },
  }

  static styles = css`
    :host {
      display: block;
      inline-size: 100%;
      max-inline-size: 580px;
      min-inline-size: 0;
    }

    .cli-shell {
      display: flex;
      align-items: safe center;
      justify-content: space-between;
      gap: 8px;
      padding-block: 6px;
      padding-inline: 14px 6px;
      border-radius: 14px;
      background: color-mix(
        in oklab,
        var(--md-sys-color-surface-container-highest, #e0e2e8) 65%,
        var(--md-sys-color-surface, #fff)
      );
      border: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant, #c2c7ce) 80%, transparent);
      min-inline-size: 0;
    }

    .cli-code-wrap {
      display: flex;
      align-items: baseline;
      gap: 8px;
      min-inline-size: 0;
      flex: 1 1 auto;
    }

    .cli-prompt {
      color: var(--md-sys-color-primary);
      font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
      font-weight: 700;
      font-size: 0.82rem;
      user-select: none;
      flex-shrink: 0;
    }

    code {
      font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
      font-size: 0.76rem;
      line-height: 1.45;
      color: var(--md-sys-color-on-surface);
      overflow-wrap: anywhere;
      letter-spacing: -0.015em;
    }

    md-icon-button {
      flex-shrink: 0;
    }

    @media (forced-colors: active) {
      .cli-shell {
        border: 1px solid CanvasText;
      }
    }
  `

  constructor() {
    super()
    this.command = 'gh repo create my-app --template treeder/flaregun-starter --clone'
    this.copied = false
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    clearTimeout(this._copyTimer)
  }

  async copyCommand() {
    try {
      await navigator.clipboard.writeText(this.command)
      this.copied = true
      snack('Copied starter command to clipboard', { showCloseIcon: true })
      clearTimeout(this._copyTimer)
      this._copyTimer = setTimeout(() => {
        this.copied = false
      }, 1800)
    } catch {
      snack('Could not access clipboard', { showCloseIcon: true })
    }
  }

  render() {
    return html`
      <div class="cli-shell">
        <div class="cli-code-wrap">
          <span class="cli-prompt" aria-hidden="true">$</span>
          <code>${this.command}</code>
        </div>
        <md-tooltip text=${this.copied ? 'Copied!' : 'Copy template command'}>
          <md-icon-button aria-label="Copy starter CLI command" @click=${this.copyCommand}>
            <md-icon>${this.copied ? 'check' : 'content_copy'}</md-icon>
          </md-icon-button>
        </md-tooltip>
      </div>
    `
  }
}

export class LandingShowcase extends LitElement {
  static properties = {
    activeTab: { type: Number, state: true },
    copied: { type: Boolean, state: true },
  }

  static styles = css`
    :host {
      display: block;
      inline-size: 100%;
      min-inline-size: 0;
      color-scheme: dark;
    }

    .studio-window {
      display: flex;
      flex-direction: column;
      border-radius: 20px;
      background: linear-gradient(165deg, #121723 0%, #0b0f17 100%);
      color: #e6edf3;
      border: 1px solid rgba(168, 187, 255, 0.18);
      box-shadow:
        0 24px 48px -16px rgba(12, 16, 28, 0.45),
        0 4px 12px -2px rgba(12, 16, 28, 0.22),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
      overflow: clip;
    }

    .window-topbar {
      display: flex;
      align-items: safe center;
      justify-content: space-between;
      gap: 8px;
      padding-block: 10px;
      padding-inline: 14px 8px;
      background: rgba(255, 255, 255, 0.03);
      border-block-end: 1px solid rgba(255, 255, 255, 0.08);
    }

    .window-dots {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      flex-shrink: 0;
    }

    .dot {
      inline-size: 10px;
      block-size: 10px;
      border-radius: 50%;
    }
    .dot-r {
      background: #ff5f57;
    }
    .dot-y {
      background: #febc2e;
    }
    .dot-g {
      background: #28c840;
    }

    .file-pill {
      font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
      font-size: 0.73rem;
      color: #9fb0c7;
      background: rgba(255, 255, 255, 0.05);
      padding-block: 4px;
      padding-inline: 9px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.07);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-inline-size: 0;
    }

    .topbar-right {
      display: inline-flex;
      align-items: safe center;
      gap: 4px;
      flex-shrink: 0;
    }

    .edge-status {
      display: inline-flex;
      align-items: safe center;
      gap: 6px;
      font-size: 0.74rem;
      font-weight: 600;
      color: #7ee787;
      background: rgba(46, 160, 67, 0.14);
      border: 1px solid rgba(126, 231, 135, 0.25);
      padding-block: 3px;
      padding-inline: 9px;
      border-radius: 999px;
    }

    .pulse-dot {
      inline-size: 6px;
      block-size: 6px;
      border-radius: 50%;
      background: #7ee787;
    }

    @media (prefers-reduced-motion: no-preference) {
      .pulse-dot {
        animation: pulseGlow 2.4s ease-in-out infinite;
      }
    }

    @keyframes pulseGlow {
      0%,
      100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.45;
        transform: scale(0.82);
      }
    }

    md-tabs {
      --md-sys-color-surface: transparent;
      --md-sys-color-on-surface: #e6edf3;
      --md-sys-color-on-surface-variant: #94a3b8;
      --md-sys-color-primary: #c4b5fd;
      --md-divider-color: rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.015);
    }

    .copy-btn {
      --md-sys-color-on-surface-variant: #cbd5e1;
    }

    pre {
      margin: 0;
      padding: 16px 18px;
      overflow-x: auto;
      scrollbar-width: thin;
      font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
      font-size: 0.79rem;
      line-height: 1.6;
      color: #e6edf3;
      min-block-size: 244px;
      box-sizing: border-box;
    }

    pre:focus-visible {
      outline: 2px solid #c4b5fd;
      outline-offset: -2px;
    }

    .kw {
      color: #ff7b72;
    }
    .fn {
      color: #d2a8ff;
    }
    .str {
      color: #a5d6ff;
    }
    .cmt {
      color: #8b949e;
      font-style: italic;
    }
    .prop {
      color: #79c0ff;
    }

    .studio-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: safe center;
      justify-content: space-between;
      gap: 10px 14px;
      padding-block: 12px;
      padding-inline: 16px;
      background: rgba(255, 255, 255, 0.03);
      border-block-start: 1px solid rgba(255, 255, 255, 0.08);
    }

    .pill-row {
      display: flex;
      flex-wrap: wrap;
      flex-wrap: balance;
      gap: 6px;
      min-inline-size: 0;
    }

    .tech-pill {
      font-size: 0.72rem;
      font-weight: 500;
      color: #cbd5e1;
      background: rgba(196, 181, 253, 0.1);
      border: 1px solid rgba(196, 181, 253, 0.2);
      padding-block: 3px;
      padding-inline: 8px;
      border-radius: 999px;
    }

    .studio-link {
      display: inline-flex;
      align-items: safe center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #c4b5fd;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .studio-link:hover,
    .studio-link:focus-visible {
      color: #ede9fe;
      text-decoration: underline;
    }

    .studio-link md-icon {
      font-size: 16px;
    }

    @media (forced-colors: active) {
      .studio-window {
        border: 1px solid CanvasText;
      }
    }
  `

  constructor() {
    super()
    this.activeTab = 0
    this.copied = false
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    clearTimeout(this._timer)
  }

  onTabChange(e) {
    this.activeTab = e.target.activeTabIndex ?? 0
    this.copied = false
  }

  async copySnippet() {
    const active = SNIPPETS[this.activeTab] || SNIPPETS[0]
    try {
      await navigator.clipboard.writeText(active.raw)
      this.copied = true
      snack(`Copied ${active.file} snippet`, { showCloseIcon: true })
      clearTimeout(this._timer)
      this._timer = setTimeout(() => {
        this.copied = false
      }, 1800)
    } catch {
      snack('Could not copy snippet', { showCloseIcon: true })
    }
  }

  renderHighlightedCode(raw) {
    return tokenizeCode(raw).map((tok) => (tok.cls ? html`<span class=${tok.cls}>${tok.text}</span>` : tok.text))
  }

  render() {
    const active = SNIPPETS[this.activeTab] || SNIPPETS[0]

    return html`
      <div class="studio-window">
        <div class="window-topbar">
          <div class="window-dots" aria-hidden="true">
            <span class="dot dot-r"></span>
            <span class="dot dot-y"></span>
            <span class="dot dot-g"></span>
          </div>

          <span class="file-pill" id="showcase-code-label">${active.file}</span>

          <div class="topbar-right">
            <span class="edge-status">
              <span class="pulse-dot" aria-hidden="true"></span>
              ${active.badge}
            </span>
            <md-tooltip text=${this.copied ? 'Copied!' : 'Copy snippet'}>
              <md-icon-button class="copy-btn" aria-label="Copy ${active.file} code snippet" @click=${this.copySnippet}>
                <md-icon>${this.copied ? 'check' : 'content_copy'}</md-icon>
              </md-icon-button>
            </md-tooltip>
          </div>
        </div>

        <md-tabs @change=${this.onTabChange} aria-label="Flaregun stack code examples">
          <md-tab type="secondary" ?active=${this.activeTab === 0}>
            <md-icon slot="icon">database</md-icon>
            Edge Data
          </md-tab>
          <md-tab type="secondary" ?active=${this.activeTab === 1}>
            <md-icon slot="icon">smart_toy</md-icon>
            MCP Agent
          </md-tab>
          <md-tab type="secondary" ?active=${this.activeTab === 2}>
            <md-icon slot="icon">passkey</md-icon>
            Auth &amp; M3
          </md-tab>
        </md-tabs>

        <pre role="region" aria-labelledby="showcase-code-label" tabindex="0"><code>${this.renderHighlightedCode(
          active.raw,
        )}</code></pre>

        <div class="studio-footer">
          <div class="pill-row">${active.pills.map((pill) => html`<span class="tech-pill">${pill}</span>`)}</div>
          <a class="studio-link" href=${active.footerHref}>
            <span>${active.footerLinkText}</span>
            <md-icon aria-hidden="true">arrow_forward</md-icon>
          </a>
        </div>
      </div>
    `
  }
}

customElements.define('cli-copy-bar', CliCopyBar)
customElements.define('landing-showcase', LandingShowcase)
