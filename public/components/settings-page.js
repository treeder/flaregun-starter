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
import { startRegistration } from 'passkeys/public/js/auth.js'

export class SettingsPage extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
        width: 100%;
        max-width: 680px;
        margin: 0 auto;
      }
      .settings-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .avatar-wrapper {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .avatar-preview {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        border: 2px solid var(--md-sys-color-outline-variant, #ccc);
        background: var(--md-sys-color-primary-container, #eaddff);
        color: var(--md-sys-color-on-primary-container, #21005d);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        font-weight: 600;
        overflow: hidden;
        flex-shrink: 0;
      }
      .avatar-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .passkey-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-radius: 8px;
        background: var(--md-sys-color-surface-container, rgba(0, 0, 0, 0.04));
        border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      }
      .passkey-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .passkey-icon {
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
    `,
  ]

  static properties = {
    user: { type: Object },
    passkeys: { type: Array },
    loadingAvatar: { type: Boolean },
    loadingProfile: { type: Boolean },
    loadingPasskeys: { type: Boolean },
    profileMessage: { type: Object },
    avatarMessage: { type: Object },
    passkeyMessage: { type: Object },
  }

  constructor() {
    super()
    this.user = {}
    this.passkeys = []
    this.loadingAvatar = false
    this.loadingProfile = false
    this.loadingPasskeys = false
    this.profileMessage = null
    this.avatarMessage = null
    this.passkeyMessage = null
  }

  connectedCallback() {
    super.connectedCallback()
    this.initUser()
    this.fetchPasskeys()
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

  async fetchPasskeys() {
    this.loadingPasskeys = true
    try {
      const res = await api('/auth/passkeys/list')
      this.passkeys = res.passkeys || []
    } catch (e) {
      console.error('Failed to fetch passkeys', e)
    } finally {
      this.loadingPasskeys = false
    }
  }

  triggerAvatarUpload() {
    const input = this.renderRoot.querySelector('#avatar-file-input')
    if (input) {
      input.click()
    }
  }

  async handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    this.loadingAvatar = true
    this.avatarMessage = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/v1/users/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Avatar upload failed')
      }

      this.user = {
        ...this.user,
        image: data.image,
      }
      this.avatarMessage = { type: 'success', text: 'Avatar updated successfully!' }

      // Update any avatar menu instances on page
      const avatarMenu = document.querySelector('avatar-menu')
      if (avatarMenu) {
        avatarMenu.user = this.user
        avatarMenu.requestUpdate()
      }
    } catch (err) {
      console.error(err)
      this.avatarMessage = { type: 'error', text: err.message || 'Failed to upload avatar' }
    } finally {
      this.loadingAvatar = false
      e.target.value = ''
    }
  }

  async removeAvatar() {
    const dialog = this.renderRoot.querySelector('#confirmDialog')
    const confirmed = await dialog.confirm({
      headline: 'Remove Avatar',
      message: 'Are you sure you want to remove your profile photo?',
      confirmText: 'Remove',
      destructive: true,
      icon: 'delete',
    })
    if (!confirmed) return

    this.loadingAvatar = true
    this.avatarMessage = null

    try {
      const res = await fetch('/v1/users/avatar', {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to remove avatar')
      }

      this.user = {
        ...this.user,
        image: null,
      }
      this.avatarMessage = { type: 'success', text: 'Avatar removed.' }

      const avatarMenu = document.querySelector('avatar-menu')
      if (avatarMenu) {
        avatarMenu.user = this.user
        avatarMenu.requestUpdate()
      }
    } catch (err) {
      console.error(err)
      this.avatarMessage = { type: 'error', text: err.message || 'Failed to remove avatar' }
    } finally {
      this.loadingAvatar = false
    }
  }

  async saveProfile() {
    const nameField = this.renderRoot.querySelector('#name-field')
    const name = nameField ? nameField.value.trim() : ''

    this.loadingProfile = true
    this.profileMessage = null

    try {
      const res = await api('/v1/users/me', {
        method: 'POST',
        body: { name },
      })

      this.user = {
        ...this.user,
        name: res.user?.name || name,
      }
      this.profileMessage = { type: 'success', text: 'Profile updated successfully!' }

      const avatarMenu = document.querySelector('avatar-menu')
      if (avatarMenu) {
        avatarMenu.user = this.user
        avatarMenu.requestUpdate()
      }
    } catch (err) {
      console.error(err)
      this.profileMessage = { type: 'error', text: err.message || 'Failed to update profile' }
    } finally {
      this.loadingProfile = false
    }
  }

  async addPasskey() {
    this.passkeyMessage = null
    try {
      const regOptions = await api('/auth/passkeys/new', {
        method: 'POST',
        body: {},
      })

      const attResp = await startRegistration({
        optionsJSON: regOptions,
      })

      const createRes = await api('/auth/passkeys/create', {
        method: 'POST',
        body: {
          credential: attResp,
          userId: regOptions.user.id,
        },
      })

      if (!createRes.verified) {
        throw new Error('Passkey verification failed.')
      }

      this.passkeyMessage = { type: 'success', text: 'Passkey successfully added!' }
      await this.fetchPasskeys()
    } catch (err) {
      console.error(err)
      if (err.name !== 'AbortError' && !err.message?.includes('cancelled')) {
        this.passkeyMessage = { type: 'error', text: err.message || 'Failed to register passkey' }
      }
    }
  }

  async deletePasskey(passkeyId) {
    const dialog = this.renderRoot.querySelector('#confirmDialog')
    const confirmed = await dialog.confirm({
      headline: 'Remove Passkey',
      message: 'Are you sure you want to remove this passkey? You will no longer be able to sign in with it.',
      confirmText: 'Remove',
      destructive: true,
      icon: 'delete',
    })
    if (!confirmed) return

    try {
      await api('/auth/passkeys/delete', {
        method: 'POST',
        body: { id: passkeyId },
      })
      this.passkeyMessage = { type: 'success', text: 'Passkey removed.' }
      await this.fetchPasskeys()
    } catch (err) {
      console.error(err)
      this.passkeyMessage = { type: 'error', text: err.message || 'Failed to remove passkey' }
    }
  }

  render() {
    const user = this.user || {}
    const initial = (user.name || user.email || 'U').charAt(0).toUpperCase()
    const imageUrl = user.image || user.avatarUrl || user.data?.image

    return html`
      <confirm-dialog id="confirmDialog"></confirm-dialog>

      <div class="flex col g24 w100">
        <div class="headline-medium">Account Settings</div>

        <!-- Section 1: Profile & Avatar -->
        <md-card class="p24 w100" style="box-sizing: border-box;">
          <div class="settings-section">
            <div class="title-large">Profile</div>
            <div class="text-muted small">Manage your public avatar and profile details.</div>

            ${
              this.avatarMessage
                ? html`<div class="feedback-msg feedback-${this.avatarMessage.type}">${this.avatarMessage.text}</div>`
                : ''
            }

            <div class="avatar-wrapper mt8">
              <div class="avatar-preview">
                ${
                  imageUrl
                    ? html`<img src="${imageUrl}" alt="${user.name || 'User Avatar'}" />`
                    : html`<span>${initial}</span>`
                }
              </div>
              <div class="flex col g8">
                <input
                  type="file"
                  id="avatar-file-input"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                  style="display: none;"
                  @change=${this.handleAvatarChange} />
                <div class="flex g8 flexw">
                  <md-button type="button" @click=${this.triggerAvatarUpload} ?disabled=${this.loadingAvatar}>
                    <md-icon slot="icon">cloud_upload</md-icon>
                    ${this.loadingAvatar ? 'Uploading...' : 'Upload New Photo'}
                  </md-button>
                  ${
                    imageUrl
                      ? html`
                          <md-button
                            type="button"
                            color="outlined"
                            class="error"
                            @click=${this.removeAvatar}
                            ?disabled=${this.loadingAvatar}>
                            <md-icon slot="icon">delete</md-icon>
                            Remove
                          </md-button>
                        `
                      : ''
                  }
                </div>
                <div class="text-muted small">Allowed formats: JPG, PNG, WEBP, AVIF, GIF. Max size 10MB.</div>
              </div>
            </div>

            <md-divider class="mt8 mb8"></md-divider>

            ${
              this.profileMessage
                ? html`<div class="feedback-msg feedback-${this.profileMessage.type}">${this.profileMessage.text}</div>`
                : ''
            }

            <form
              id="profile-form"
              class="flex col g16 w100"
              @submit=${(e) => {
                e.preventDefault()
                this.saveProfile()
              }}>
              <md-text-field
                id="name-field"
                label="Full Name"
                value="${user.name || ''}"
                placeholder="Enter your full name"></md-text-field>

              <md-text-field
                id="email-field"
                label="Email"
                value="${user.email || ''}"
                disabled
                supporting-text="Email address cannot be changed"></md-text-field>

              <div class="flex jce mt8">
                <md-button type="button" @click=${this.saveProfile} ?disabled=${this.loadingProfile}>
                  ${this.loadingProfile ? 'Saving...' : 'Save Profile'}
                </md-button>
              </div>
            </form>
          </div>
        </md-card>

        <!-- Section 2: Passkeys & Security -->
        <md-card class="p24 w100" style="box-sizing: border-box;">
          <div class="settings-section">
            <div class="flex jcsb aic flexw g8">
              <div>
                <div class="title-large">Passkeys</div>
                <div class="text-muted small mt4">
                  Passkeys provide fast and secure sign-in using biometric authentication or security keys.
                </div>
              </div>
              <md-button type="button" @click=${this.addPasskey}>
                <md-icon slot="icon">add</md-icon>
                Add Passkey
              </md-button>
            </div>

            ${
              this.passkeyMessage
                ? html`<div class="feedback-msg feedback-${this.passkeyMessage.type}">${this.passkeyMessage.text}</div>`
                : ''
            }

            <div class="flex col g12 mt8">
              ${
                this.loadingPasskeys
                  ? html`<div class="text-muted p16 text-center">Loading passkeys...</div>`
                  : this.passkeys.length === 0
                    ? html`
                        <div
                          class="text-muted p16 text-center"
                          style="background: var(--md-sys-color-surface-container, rgba(0,0,0,0.02)); border-radius: 8px;">
                          No passkeys configured yet. Add one to sign in seamlessly without entering your email every
                          time.
                        </div>
                      `
                    : this.passkeys.map(
                        (pk) => html`
                          <div class="passkey-item">
                            <div class="passkey-info">
                              <div class="passkey-icon">
                                <md-icon>fingerprint</md-icon>
                              </div>
                              <div class="flex col g4">
                                <div style="font-weight: 500; font-size: 14px;">${pk.name || 'Passkey'}</div>
                                <div class="flex g8 aic flexw">
                                  <span class="badge"
                                    >${pk.deviceType === 'multiDevice' ? 'Synced Passkey' : 'Security Key'}</span
                                  >
                                  ${
                                    pk.createdAt
                                      ? html`<span class="text-muted small"
                                          >Added on ${new Date(pk.createdAt).toLocaleDateString()}</span
                                        >`
                                      : ''
                                  }
                                </div>
                              </div>
                            </div>
                            <md-icon-button
                              class="error"
                              title="Remove Passkey"
                              aria-label="Remove Passkey"
                              @click=${() => this.deletePasskey(pk.id)}>
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

customElements.define('settings-page', SettingsPage)
