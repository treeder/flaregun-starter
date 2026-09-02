import { LitElement, html, css } from 'lit'
import 'material/menu/menu.js'
import 'material/menu/menu-item.js'
import 'material/divider/divider.js'
import 'material/icon/icon.js'
import { signOut } from 'passkeys/public/js/signout.js'
import { styles } from '/css/styles.js'

export class AvatarMenu extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: inline-block;
        position: relative;
      }
      .avatar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 2px solid var(--md-sys-color-outline-variant, #ccc);
        background: var(--md-sys-color-primary-container, #eaddff);
        color: var(--md-sys-color-on-primary-container, #21005d);
        cursor: pointer;
        padding: 0;
        overflow: hidden;
        font-weight: 600;
        font-size: 15px;
        transition:
          box-shadow 0.2s,
          border-color 0.2s,
          transform 0.1s;
      }
      .avatar-btn:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        border-color: var(--md-sys-color-primary, #6750a4);
      }
      .avatar-btn:active {
        transform: scale(0.96);
      }
      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .menu-header {
        padding: 12px 16px;
        min-width: 200px;
        box-sizing: border-box;
      }
      .menu-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--md-sys-color-on-surface, #1c1b1f);
      }
      .menu-email {
        font-size: 12px;
        color: var(--md-sys-color-on-surface-variant, #49454f);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-top: 2px;
      }
      a.menu-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      md-menu-item {
        cursor: pointer;
      }
    `,
  ]

  static properties = {
    user: { type: Object },
  }

  constructor() {
    super()
    this.user = {}
  }

  getUser() {
    if (typeof this.user === 'string') {
      try {
        return JSON.parse(this.user)
      } catch (e) {
        return {}
      }
    }
    return this.user || {}
  }

  toggleMenu(e) {
    e?.stopPropagation()
    const menu = this.renderRoot.querySelector('#avatar-menu')
    if (menu) {
      menu.open = !menu.open
    }
  }

  async handleSignOut(e) {
    e?.preventDefault()
    signOut()
    window.location.href = '/'
  }

  render() {
    const user = this.getUser()
    const imageUrl = user.image || user.avatarUrl || user.data?.image || user.data?.avatarUrl
    const initial = (user.name || user.email || 'U').charAt(0).toUpperCase()

    return html`
      <div style="position: relative; display: inline-block;">
        <button
          id="avatar-anchor"
          class="avatar-btn"
          @click=${this.toggleMenu}
          aria-label="User account menu"
          aria-haspopup="true">
          ${
            imageUrl
              ? html`<img src="${imageUrl}" class="avatar-img" alt="${user.name || 'User Avatar'}" />`
              : html`<span>${initial}</span>`
          }
        </button>

        <md-menu id="avatar-menu" anchor="avatar-anchor" anchor-corner="end-end" menu-corner="start-end">
          <div class="menu-header">
            <div class="menu-name">${user.name || 'Account'}</div>
            <div class="menu-email">${user.email || ''}</div>
          </div>
          <md-divider></md-divider>
          <a href="/settings" class="menu-link">
            <md-menu-item>
              <md-icon slot="start">settings</md-icon>
              <div slot="headline">Settings</div>
            </md-menu-item>
          </a>
          <md-divider></md-divider>
          <md-menu-item @click=${this.handleSignOut}>
            <md-icon slot="start">logout</md-icon>
            <div slot="headline">Sign out</div>
          </md-menu-item>
        </md-menu>
      </div>
    `
  }
}

customElements.define('avatar-menu', AvatarMenu)
