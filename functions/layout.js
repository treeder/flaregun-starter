import { html, slot, stringifyAttribute } from 'rend'
import { escapeHtml } from './utils.js'

export async function layout(d) {
  let title = d.title ? d.title + ' - Flaregun' : 'Flaregun Starter Kit'
  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/images/flaregun2.png" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          as="style"
          onload="this.onload=null;this.rel='stylesheet'" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;700&display=swap"
          as="style"
          onload="this.onload=null;this.rel='stylesheet'" />

        <link rel="stylesheet" href="/css/styles.css" />

        <script type="importmap">
          {
            "imports": {
              "lit": "https://cdn.jsdelivr.net/npm/lit@3/index.js",
              "lit/": "https://cdn.jsdelivr.net/npm/lit@3/",
              "@lit/localize": "https://cdn.jsdelivr.net/npm/@lit/localize/lit-localize.js",
              "@lit/reactive-element": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2/reactive-element.js",
              "@lit/reactive-element/": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2/",
              "lit-element/lit-element.js": "https://cdn.jsdelivr.net/npm/lit-element@4/lit-element.js",
              "lit-html": "https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js",
              "lit-html/": "https://cdn.jsdelivr.net/npm/lit-html@3/",
              "material/": "https://cdn.jsdelivr.net/gh/material-esm/material@3/",
              "api": "https://cdn.jsdelivr.net/gh/treeder/api@1/api.js",
              "state": "https://cdn.jsdelivr.net/gh/treeder/state@3/state.js",
              "models": "https://cdn.jsdelivr.net/gh/treeder/models@1/index.js",
              "passkeys/": "https://cdn.jsdelivr.net/gh/treeder/passkeys@6/"
            }
          }
        </script>
      </head>
      <body>
        <script type="module">
          import '/components/avatar-menu.js'
          import '/components/cart-drawer.js'
          import 'material/divider/divider.js'
          import 'material/icon/icon.js'
        </script>
        <header class="flex g12 jcsb mb20 topnav p16">
          <div class="flex g16 aic flexw">
            <a href="/">
              <div class="flex g8 jcc aic">
                <img src="/images/flaregun2.png" alt="" width="38" height="40" style="height: 40px;" />
                <div class="title-large">Flaregun Starter Kit</div>
              </div>
            </a>
            <nav class="flex g8 aic" aria-label="Primary">
              <a href="/" class="nav-item ${d.path === '/' ? 'active' : ''}">Home</a>
              <a href="/products" class="nav-item ${d.path?.startsWith('/products') ? 'active' : ''}">Products</a>
              ${
                d.user
                  ? html`<a href="/orders" class="nav-item ${d.path?.startsWith('/orders') ? 'active' : ''}">Orders</a>`
                  : ''
              }
              <a href="/demo" class="nav-item ${d.path === '/demo' ? 'active' : ''}">Components Demo</a>
            </nav>
          </div>
          <div class="flex g8 jcc aic">
            <cart-button user="${stringifyAttribute(d.user)}"></cart-button>
            <div>
              ${
                d.user
                  ? html`<avatar-menu user="${stringifyAttribute(d.user)}"></avatar-menu>`
                  : html`<avatar-menu></avatar-menu>`
              }
            </div>
          </div>
        </header>

        <main class="page-main">${await slot('main', d)}</main>

        ${footer(d)}
      </body>
    </html> `
}

function footer(d) {
  const year = new Date().getFullYear()
  return html`
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="site-footer-grid">
          <div class="site-footer-brand-col">
            <a href="/" class="footer-brand">
              <img src="/images/flaregun2.png" alt="" width="30" height="32" loading="lazy" class="footer-logo" />
              <span class="title-large footer-brand-title">Flaregun Starter Kit</span>
            </a>
            <p class="footer-tagline">
              Full-stack Cloudflare Workers starter with D1 models, KV, R2, Passkey authentication, Material 3 Web
              Components, and a built-in MCP server.
            </p>
            <div class="footer-badge">
              <md-icon aria-hidden="true">bolt</md-icon>
              <span>Edge-ready on Cloudflare Workers</span>
            </div>
          </div>

          <nav class="footer-nav" aria-labelledby="footer-nav-app">
            <div class="footer-heading" id="footer-nav-app">Application</div>
            <ul class="footer-links">
              <li><a href="/" ${d.path === '/' ? 'aria-current="page"' : ''}>Home</a></li>
              <li>
                <a href="/products" ${d.path?.startsWith('/products') ? 'aria-current="page"' : ''}>Products Catalog</a>
              </li>
              <li><a href="/demo" ${d.path === '/demo' ? 'aria-current="page"' : ''}>Components Demo</a></li>
              ${
                d.user
                  ? html`<li>
                        <a href="/orders" ${d.path?.startsWith('/orders') ? 'aria-current="page"' : ''}>My Orders</a>
                      </li>
                      <li>
                        <a href="/settings" ${d.path === '/settings' ? 'aria-current="page"' : ''}>Account Settings</a>
                      </li>`
                  : html`<li><a href="/signin" ${d.path === '/signin' ? 'aria-current="page"' : ''}>Sign In</a></li>`
              }
            </ul>
          </nav>

          <nav class="footer-nav" aria-labelledby="footer-nav-dev">
            <div class="footer-heading" id="footer-nav-dev">Developer</div>
            <ul class="footer-links">
              <li>
                <a href="/v1/products">REST API <code>/v1</code></a>
              </li>
              <li>
                <a href="/settings">MCP &amp; API Keys <code>/mcp</code></a>
              </li>
              <li>
                <a
                  href="https://github.com/treeder/flaregun-starter/blob/main/docs/mcp.md"
                  target="_blank"
                  rel="noopener noreferrer">
                  MCP Documentation
                </a>
              </li>
              <li>
                <a href="https://github.com/treeder/models" target="_blank" rel="noopener noreferrer">Data Models</a>
              </li>
            </ul>
          </nav>

          <nav class="footer-nav" aria-labelledby="footer-nav-resources">
            <div class="footer-heading" id="footer-nav-resources">Resources</div>
            <ul class="footer-links">
              <li>
                <a href="https://github.com/treeder/flaregun-starter" target="_blank" rel="noopener noreferrer">
                  Starter Template
                </a>
              </li>
              <li>
                <a href="https://github.com/treeder/flaregun" target="_blank" rel="noopener noreferrer">
                  Flaregun Library
                </a>
              </li>
              <li>
                <a href="https://material-esm.github.io/material/demo/" target="_blank" rel="noopener noreferrer">
                  Material 3 ESM
                </a>
              </li>
              <li>
                <a href="https://developers.cloudflare.com/workers/" target="_blank" rel="noopener noreferrer">
                  Cloudflare Workers Docs
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <md-divider></md-divider>

        <div class="site-footer-bottom">
          <p class="footer-copyright">&copy; ${year} Flaregun Starter Kit. Apache-2.0 License.</p>
          <ul class="footer-bottom-links">
            <li>
              <a href="https://github.com/treeder/flaregun-starter" target="_blank" rel="noopener noreferrer">
                <md-icon aria-hidden="true">code</md-icon>
                <span>GitHub</span>
              </a>
            </li>
            <li>
              <a
                href="https://deploy.workers.cloudflare.com/?url=https://github.com/treeder/flaregun-starter"
                target="_blank"
                rel="noopener noreferrer">
                <md-icon aria-hidden="true">rocket_launch</md-icon>
                <span>Deploy to Cloudflare</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  `
}
