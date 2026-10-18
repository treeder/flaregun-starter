import { html } from 'rend'

export async function onRequestGet(c) {
  return await c.data.rend.html({
    main: render,
  })
}

function render(d) {
  const userAttr = d.user ? JSON.stringify(d.user).replace(/"/g, '&quot;') : ''

  return html`
    <script type="module">
      import '/components/product-form.js'
      import '/components/product-list.js'
      import '/components/confirm-dialog.js'
      import 'material/buttons/button.js'
      import 'material/buttons/icon-button.js'
      import 'material/card/card.js'
      import 'material/icon/icon.js'
    </script>

    <div class="flex col g32 p16" style="max-width: 1120px; margin: 0 auto;">
      <!-- Hero Section -->
      <div
        class="flex col aic tac g20 p24"
        style="background: var(--md-sys-color-surface-container, #f3edf7); border-radius: 24px; border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0); padding: 48px 24px;">
        <div class="flex aic g8" style="background: var(--md-sys-color-secondary-container, #e8def8); color: var(--md-sys-color-on-secondary-container, #1d192b); padding: 6px 16px; border-radius: 999px; font-weight: 500; font-size: 13px;">
          <md-icon style="font-size: 18px;">bolt</md-icon>
          <span>Full-Stack Cloudflare Workers Starter</span>
        </div>

        <div class="display-medium" style="font-weight: 700; max-width: 760px;">
          ${d.user
            ? `Welcome back, ${d.user.name || d.user.email || 'Builder'}!`
            : 'Build fast, modern edge apps with Flaregun'}
        </div>

        <div
          style="color: var(--md-sys-color-on-surface-variant); font-size: 1.15rem; line-height: 1.6; max-width: 680px;">
          ${d.user
            ? 'You are signed in. You can now create, edit, and delete products below or manage your full catalog.'
            : 'Everything you need to ship on Cloudflare Workers—D1 database models, KV, R2 storage, Passkey authentication, and Material 3 Web Components.'}
        </div>

        <div class="flex flexw jcc aic g12 mt8">
          ${d.user
            ? html`
                <a href="/products">
                  <md-button color="filled">
                    <md-icon slot="icon">inventory_2</md-icon>
                    Manage Products
                  </md-button>
                </a>
                <a href="/demo">
                  <md-button color="outlined">
                    <md-icon slot="icon">widgets</md-icon>
                    View Components Showcase
                  </md-button>
                </a>
                <a href="/settings">
                  <md-button color="text">
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
              `}
        </div>
      </div>

      <!-- Feature Highlights -->
      <div class="grid g16" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
        <md-card class="p20 flex col g8">
          <div class="flex aic g8" style="color: var(--md-sys-color-primary);">
            <md-icon>database</md-icon>
            <div class="title-medium" style="font-weight: 600;">D1, KV &amp; R2 Built-In</div>
          </div>
          <div class="text-muted" style="line-height: 1.5;">
            Zero-boilerplate wrappers for Cloudflare D1 SQL models, JSON merge patches, scoped KV storage, and R2 buckets.
          </div>
        </md-card>

        <md-card class="p20 flex col g8">
          <div class="flex aic g8" style="color: var(--md-sys-color-primary);">
            <md-icon>passkey</md-icon>
            <div class="title-medium" style="font-weight: 600;">Passkeys &amp; Magic Links</div>
          </div>
          <div class="text-muted" style="line-height: 1.5;">
            Passwordless authentication out of the box with WebAuthn passkeys, email verification, and user profile management.
          </div>
        </md-card>

        <md-card class="p20 flex col g8">
          <div class="flex aic g8" style="color: var(--md-sys-color-primary);">
            <md-icon>widgets</md-icon>
            <div class="title-medium" style="font-weight: 600;">Material 3 Web Components</div>
          </div>
          <div class="text-muted" style="line-height: 1.5;">
            Native Lit &amp; Material 3 ESM components with no complex client bundle required. Explore the <a href="/demo">interactive demo</a>.
          </div>
        </md-card>
      </div>

      <!-- Recent Products Section -->
      <div class="flex col g16">
        <div class="flex jcsb aic flexw g12">
          <div class="flex col g4">
            <div class="headline-medium" style="font-weight: 600;">Recent Products</div>
            <div class="text-muted">
              ${d.user
                ? 'Manage your product catalog—add new items, edit details, or remove products.'
                : 'Explore recent items from the store. Sign in to add, edit, or delete products.'}
            </div>
          </div>
          <a href="/products">
            <md-button color="text">
              View All Products
              <md-icon slot="icon">arrow_forward</md-icon>
            </md-button>
          </a>
        </div>

        <product-list
          user="${userAttr}"
          ${d.user ? 'can-manage' : ''}></product-list>
      </div>
    </div>
  `
}
