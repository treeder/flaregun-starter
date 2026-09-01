import { html, css, LitElement } from 'lit'
import 'material/buttons/button.js'
import 'material/text/text-field.js'
import 'material/card/card.js'
import { api } from 'api'
import { startRegistration, startAuthentication } from 'passkeys/public/js/auth.js'
import { styles } from '/css/styles.js'
import { signOut } from 'passkeys/public/js/signout.js'

export class SignIn extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
        width: 100%;
        max-width: 400px;
      }
      .divider {
        display: flex;
        align-items: center;
        text-align: center;
        margin: 8px 0;
      }
      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid var(--md-sys-color-outline-variant, #ccc);
      }
      .divider:not(:empty)::before {
        margin-right: 0.75em;
      }
      .divider:not(:empty)::after {
        margin-left: 0.75em;
      }
    `,
  ]

  static properties = {
    baseURL: { type: String },
    afterLoginHref: { type: String },
    capable: { type: Boolean },
    hasPasskey: { type: Boolean },
    error: { type: Object },
    success: { type: Object },
  }

  constructor() {
    super()
    this.baseURL = ''
    this.afterLoginHref = '/'
    this.capable = false
    this.hasPasskey = false
    this.error = null
    this.success = null
  }

  connectedCallback() {
    super.connectedCallback()
    this.checkCapabilities()
  }

  async checkCapabilities() {
    if (window.PublicKeyCredential) {
      this.capable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    }
    if (!this.capable) return

    if (!this.isLoggedIn()) {
      this.signin2(true) // Start conditional UI / autofill
    } else {
      try {
        let r = await api(`${this.baseURL}/passkeys/check`, {
          method: 'POST',
          body: {},
        })
        if (r.numPasskeys > 0) {
          this.hasPasskey = true
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  render() {
    let err = ''
    if (this.error) {
      err = html`<div class="error mb16">${this.error.message}</div>`
    }

    if (this.success) {
      return html`
        <md-card class="p24 w100" style="box-sizing: border-box;">
          <div class="success">
            ${this.success.message}
            ${this.success.link ? html`<br /><br /><a href="${this.success.link}">Click to verify</a>` : ''}
          </div>
        </md-card>
      `
    }

    if (this.isLoggedIn()) {
      if (!this.capable) {
        return html`
          <md-card class="p24 w100" style="box-sizing: border-box;">
            <div class="flex col g16 aic tac">
              ${err}
              <div>
                You are signed in.<br /><br />
                <a href="${this.afterLoginHref}">Continue to dashboard</a>.
              </div>
            </div>
          </md-card>
        `
      }

      return html`
        <md-card class="p24 w100" style="box-sizing: border-box;">
          <div class="flex col g16 aic tac">
            ${err}
            ${
              this.hasPasskey
                ? html`
                    <div>
                      You already have a passkey.<br /><br />
                      <a href="${this.afterLoginHref}">Continue to dashboard</a>.
                    </div>
                  `
                : html`
                    <div>
                      <a href="${this.afterLoginHref}">Skip this and create passkey later</a>
                    </div>
                  `
            }
            <div>
              <md-button type="button" @click=${this.createPasskey}>Create Passkey</md-button>
            </div>
          </div>
        </md-card>
      `
    }

    return html`
      <md-card class="p24 w100" style="box-sizing: border-box;">
        <form
          id="signin-form"
          class="w100"
          @submit=${(e) => {
            e.preventDefault()
            this.emailStart()
          }}>
          <div class="flex col g16">
            ${err}
            <md-text-field
              label="Email"
              type="email"
              id="email"
              @keyup=${this.keyUpHandler}
              required
              autocomplete="${this.capable ? 'webauthn' : 'email'}"></md-text-field>
            <md-button type="button" @click=${this.emailStart} class="mt8">Continue</md-button>
            ${
              this.capable
                ? html`
                    <div class="divider text-muted small">OR</div>
                    <md-button type="button" color="outlined" @click=${this.signin}>Sign in with Passkey</md-button>
                  `
                : ''
            }
          </div>
        </form>
      </md-card>
    `
  }

  isLoggedIn() {
    return document.cookie.includes('userId=')
  }

  signOut() {
    signOut()
  }

  keyUpHandler(e) {
    if (e.key === 'Enter') {
      this.emailStart()
    }
  }

  async emailStart() {
    this.error = null
    let emailF = this.renderRoot.getElementById('email')
    if (!emailF.reportValidity()) {
      return
    }
    let email = emailF.value.trim().toLowerCase()
    try {
      let r = await api(`${this.baseURL}/email/start`, {
        method: 'POST',
        body: { email: email, afterLoginHref: this.afterLoginHref },
      })
      this.success = r
    } catch (e) {
      console.error(e)
      this.error = e
    }
  }

  async signin() {
    this.signin2(false)
  }

  async signin2(conditionalUI = false) {
    this.error = null
    let challenge
    try {
      challenge = await api(`${this.baseURL}/passkeys/start`, {
        method: 'POST',
        body: {},
      })

      let cred
      try {
        cred = await startAuthentication({
          optionsJSON: challenge,
          useBrowserAutofill: conditionalUI,
          verifyBrowserAutofillInput: false,
        })
      } catch (e) {
        if (conditionalUI && e.name === 'AbortError') {
          return
        }
        throw e
      }

      let r = await api(`${this.baseURL}/passkeys/verify`, {
        method: 'POST',
        body: {
          credential: cred,
        },
      })
      if (!r.verified) {
        this.error = { message: 'Not verified' }
      } else {
        this.success = { message: 'You signed in with a passkey!' }
      }
      window.location.href = this.afterLoginHref || '/'
    } catch (e) {
      console.error(e)
      if (!(e.message?.includes('autofill') || e.message?.includes('autocomplete'))) {
        this.error = e
      }
    }
  }

  async createPasskey() {
    this.error = null
    let regOptions
    try {
      regOptions = await api(`${this.baseURL}/passkeys/new`, {
        method: 'POST',
        body: {},
      })
    } catch (e) {
      console.error(e)
      this.error = e
      return
    }
    let userId = regOptions.user.id

    let attResp = null
    try {
      attResp = await startRegistration({
        optionsJSON: regOptions,
      })
    } catch (error) {
      console.error(error)
      this.error = error
      throw error
    }

    try {
      let r = await api(`${this.baseURL}/passkeys/create`, {
        method: 'POST',
        body: {
          credential: attResp,
          userId: userId,
        },
      })
      if (!r.verified) {
        this.error = { message: 'Not verified' }
      } else {
        this.success = {
          message: html`Passkey created! Next time you can sign in with it. <br /><br /><a href="${this.afterLoginHref}"
              >Continue to dashboard</a
            >`,
        }
      }
    } catch (e) {
      console.error(e)
      this.error = e
    }
  }
}

customElements.define('sign-in', SignIn)
