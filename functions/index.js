import { html, stringifyAttribute } from 'rend'
import { escapeHtml } from './utils.js'

export async function onRequestGet(c) {
  return await c.data.rend.html({
    main: render,
  })
}

function render(d) {
  const userAttr = stringifyAttribute(d.user)

  return html`
    <script type="module">
      import '/components/landing-showcase.js'
      import '/components/product-form.js'
      import '/components/product-list.js'
      import '/components/confirm-dialog.js'
      import 'material/buttons/button.js'
      import 'material/buttons/icon-button.js'
      import 'material/card/card.js'
      import 'material/icon/icon.js'
    </script>

    <div class="landing-shell">
      <!-- Hero Stage -->
      <section class="hero-stage" aria-labelledby="hero-heading">
        <div class="hero-grid">
          <div class="hero-copy">
            <div class="hero-eyebrow">
              <md-icon aria-hidden="true">bolt</md-icon>
              <span>Full-Stack Cloudflare Workers Starter</span>
              <span class="hero-eyebrow-sep" aria-hidden="true">&middot;</span>
              <span class="hero-eyebrow-tag">v4.1</span>
            </div>

            <h1 id="hero-heading" class="hero-title">
              ${
                d.user
                  ? `Welcome back, ${escapeHtml(d.user.name || d.user.email || 'Builder')}!`
                  : 'Build fast, modern edge apps with Flaregun'
              }
            </h1>

            <p class="hero-lead">
              ${
                d.user
                  ? 'Explore the live edge marketplace below, upload product photos to R2, leave star reviews, or mint scoped MCP API keys for your AI agents.'
                  : 'Ship globally on Cloudflare Workers with zero boilerplate—typed D1 SQL models & joins, KV guest-to-user cart, R2 media storage, Passkey auth, Material 3 Web Components, and MCP.'
              }
            </p>

            <div class="hero-actions">
              ${
                d.user
                  ? html`
                      <a href="/products">
                        <md-button color="filled">
                          <md-icon slot="icon">inventory_2</md-icon>
                          Manage Products
                        </md-button>
                      </a>
                      <a href="/demo">
                        <md-button color="tonal">
                          <md-icon slot="icon">widgets</md-icon>
                          View Components Showcase
                        </md-button>
                      </a>
                      <a href="/settings">
                        <md-button color="outlined">
                          <md-icon slot="icon">settings</md-icon>
                          Account Settings
                        </md-button>
                      </a>
                    `
                  : html`
                      <a href="/signin">
                        <md-button color="filled">
                          <md-icon slot="icon">login</md-icon>
                          Sign In to Get Started
                        </md-button>
                      </a>
                      <a href="/products">
                        <md-button color="tonal">
                          <md-icon slot="icon">storefront</md-icon>
                          Browse Products
                        </md-button>
                      </a>
                      <a href="/demo">
                        <md-button color="outlined">
                          <md-icon slot="icon">widgets</md-icon>
                          View Components Showcase
                        </md-button>
                      </a>
                    `
              }
            </div>

            <cli-copy-bar command="gh repo create my-app --template treeder/flaregun-starter --clone"></cli-copy-bar>

            <dl class="hero-metrics">
              <div class="metric-item">
                <dt>Pre-bound on c.data</dt>
                <dd>D1 &middot; KV &middot; R2</dd>
              </div>
              <div class="metric-item">
                <dt>Passwordless Auth</dt>
                <dd>WebAuthn Passkeys</dd>
              </div>
              <div class="metric-item">
                <dt>Native Import Maps</dt>
                <dd>Material 3 ESM</dd>
              </div>
              <div class="metric-item">
                <dt>AI Agent Endpoint</dt>
                <dd>/mcp Built-In</dd>
              </div>
            </dl>
          </div>

          <div class="hero-visual">
            <landing-showcase></landing-showcase>
          </div>
        </div>
      </section>

      <!-- Architecture & Primitives Bento Grid -->
      <section class="bento-section" aria-labelledby="architecture-heading">
        <div class="section-head">
          <div class="section-head-copy">
            <div class="section-kicker">
              <md-icon aria-hidden="true">layers</md-icon>
              <span>Architecture &amp; Primitives</span>
            </div>
            <h2 id="architecture-heading" class="section-heading">Everything wired at the edge, out of the box</h2>
            <p class="section-subtitle">
              Every HTTP route, scheduled cron job, and queue handler receives pre-initialized bindings on
              <code>c.data</code>—with zero defensive boilerplate or heavy client bundles.
            </p>
          </div>
        </div>

        <div class="bento-grid">
          <article class="bento-card bento-span-7">
            <div class="bento-top">
              <div class="bento-icon-row">
                <span class="bento-icon-badge" aria-hidden="true">
                  <md-icon>database</md-icon>
                </span>
                <span class="bento-tag">c.data.d1 &middot; SQLite</span>
              </div>
              <h3 class="bento-title">D1 SQL Models, Joins &amp; Atomic JSON Merge Patch</h3>
              <p class="bento-desc">
                Define clean model classes with automatic <code>nanoid()</code> IDs, schema migrations, typed dates and
                JSON columns, relational <code>LEFT JOIN</code> queries, and atomic RFC 7396 <code>json_patch</code>
                updates right in SQLite.
              </p>
            </div>
            <footer class="bento-footer">
              <div class="bento-chips">
                <span class="mini-pill">Auto Migrations</span>
                <span class="mini-pill">JSON Path Queries</span>
                <span class="mini-pill">RFC 7396 Patch</span>
              </div>
              <a href="/products" class="bento-link">
                <span>Live Catalog</span>
                <md-icon aria-hidden="true">arrow_forward</md-icon>
              </a>
            </footer>
          </article>

          <article class="bento-card bento-span-5">
            <div class="bento-top">
              <div class="bento-icon-row">
                <span class="bento-icon-badge tone-secondary" aria-hidden="true">
                  <md-icon>smart_toy</md-icon>
                </span>
                <span class="bento-tag">POST /mcp</span>
              </div>
              <h3 class="bento-title">MCP Endpoint Built-In</h3>
              <p class="bento-desc">
                Connect Claude, Gemini, or Cursor directly to <code>/mcp</code> over Streamable HTTP or SSE using
                per-user <code>fg_key_*</code> bearer tokens with granular read/write scopes.
              </p>
            </div>
            <footer class="bento-footer">
              <div class="bento-chips">
                <span class="mini-pill">Streamable HTTP</span>
                <span class="mini-pill">Scoped Keys</span>
              </div>
              <a href="/settings" class="bento-link">
                <span>API Keys</span>
                <md-icon aria-hidden="true">arrow_forward</md-icon>
              </a>
            </footer>
          </article>

          <article class="bento-card bento-span-4">
            <div class="bento-top">
              <div class="bento-icon-row">
                <span class="bento-icon-badge tone-tertiary" aria-hidden="true">
                  <md-icon>passkey</md-icon>
                </span>
                <span class="bento-tag">/auth/*</span>
              </div>
              <h3 class="bento-title">Passkeys &amp; Magic Links</h3>
              <p class="bento-desc">
                Passwordless authentication out of the box with WebAuthn biometric passkeys, email verification links,
                and profile management—no external auth vendor required.
              </p>
            </div>
            <footer class="bento-footer">
              <span class="mini-pill">WebAuthn</span>
              <a href="/signin" class="bento-link">
                <span>Try Sign-In</span>
                <md-icon aria-hidden="true">arrow_forward</md-icon>
              </a>
            </footer>
          </article>

          <article class="bento-card bento-span-4">
            <div class="bento-top">
              <div class="bento-icon-row">
                <span class="bento-icon-badge" aria-hidden="true">
                  <md-icon>widgets</md-icon>
                </span>
                <span class="bento-tag">material-esm</span>
              </div>
              <h3 class="bento-title">Material 3 Web Components</h3>
              <p class="bento-desc">
                Pure Lit &amp; Material 3 ESM components served via native browser import maps with adaptive light and
                dark themes and fast server-rendered layouts.
              </p>
            </div>
            <footer class="bento-footer">
              <span class="mini-pill">Zero Bundle Lock-In</span>
              <a href="/demo" class="bento-link">
                <span>Interactive Demo</span>
                <md-icon aria-hidden="true">arrow_forward</md-icon>
              </a>
            </footer>
          </article>

          <article class="bento-card bento-span-4">
            <div class="bento-top">
              <div class="bento-icon-row">
                <span class="bento-icon-badge tone-tertiary" aria-hidden="true">
                  <md-icon>cloud_done</md-icon>
                </span>
                <span class="bento-tag">KV &middot; R2 &middot; Cron</span>
              </div>
              <h3 class="bento-title">KV Cart, R2 &amp; Scheduler</h3>
              <p class="bento-desc">
                Scoped KV guest carts that merge on sign-in, validated R2 media uploads at <code>/r2/*</code>, cron
                <code>Scheduler</code> intervals, and transactional email receipts.
              </p>
            </div>
            <footer class="bento-footer">
              <span class="mini-pill">Edge Storage</span>
              <a href="${d.user ? '/orders' : '/products'}" class="bento-link">
                <span>${d.user ? 'My Orders' : 'Try Cart'}</span>
                <md-icon aria-hidden="true">arrow_forward</md-icon>
              </a>
            </footer>
          </article>
        </div>
      </section>

      <!-- Live Marketplace Section -->
      <section class="marketplace-section" aria-labelledby="marketplace-heading">
        <div class="section-head">
          <div class="section-head-copy">
            <div class="section-kicker">
              <md-icon aria-hidden="true">storefront</md-icon>
              <span>Interactive Full-Stack Reference App</span>
            </div>
            <h2 id="marketplace-heading" class="section-heading">Recent Products</h2>
            <p class="section-subtitle">
              ${
                d.user
                  ? 'Shop community and official listings, upload R2 product imagery, or click "New Product" to list an item.'
                  : 'Test the live reference marketplace—filter listings, add items to your KV guest cart, or sign in to publish products.'
              }
            </p>
          </div>

          <a href="/products">
            <md-button color="tonal">
              View All Products
              <md-icon slot="icon">arrow_forward</md-icon>
            </md-button>
          </a>
        </div>

        <div class="live-stack-pills" aria-label="Marketplace capabilities">
          <span class="stack-chip">
            <md-icon aria-hidden="true">join_left</md-icon>
            D1 Seller Joins
          </span>
          <span class="stack-chip">
            <md-icon aria-hidden="true">shopping_cart</md-icon>
            KV Guest-to-User Cart
          </span>
          <span class="stack-chip">
            <md-icon aria-hidden="true">photo_library</md-icon>
            R2 Product Images
          </span>
          <span class="stack-chip">
            <md-icon aria-hidden="true">star</md-icon>
            Aggregated Star Reviews
          </span>
        </div>

        <product-list user="${userAttr}" limit="6" ${d.user ? 'can-manage' : ''}></product-list>
      </section>

      <!-- Bottom Launchpad CTA -->
      <section class="cta-launchpad" aria-labelledby="launchpad-heading">
        <div class="cta-launchpad-copy">
          <h2 id="launchpad-heading" class="cta-launchpad-title">Ready to ship your own app on Cloudflare Workers?</h2>
          <p class="cta-launchpad-desc">
            Clone the starter template with D1 migrations, Passkey authentication, Material 3 UI, and an MCP agent
            server ready from commit one.
          </p>
        </div>
        <div class="cta-launchpad-actions">
          <a
            href="https://deploy.workers.cloudflare.com/?url=https://github.com/treeder/flaregun-starter"
            target="_blank"
            rel="noopener noreferrer">
            <md-button color="filled">
              <md-icon slot="icon">rocket_launch</md-icon>
              Deploy to Cloudflare
            </md-button>
          </a>
          <a href="https://github.com/treeder/flaregun-starter" target="_blank" rel="noopener noreferrer">
            <md-button color="outlined">
              <md-icon slot="icon">code</md-icon>
              Use GitHub Template
            </md-button>
          </a>
        </div>
      </section>
    </div>
  `
}
