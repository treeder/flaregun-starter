import { escapeHtml } from '../utils.js'

/**
 * Formats sender address with display name and strips header-injection characters.
 * Returns empty string if no sender address is provided.
 * @param {string} [fromValue]
 * @param {string} [defaultAppName='Flaregun']
 * @returns {string}
 */
export function formatAppFrom(fromValue, defaultAppName = 'Flaregun') {
  const safeAppName = String(defaultAppName || 'Flaregun')
    .replace(/[\r\n]+/g, ' ')
    .trim()
  const trimmed = String(fromValue || '')
    .replace(/[\r\n]+/g, '')
    .trim()
  if (!trimmed) return ''
  return trimmed.includes('<') ? trimmed : `${safeAppName} <${trimmed}>`
}

/**
 * Renders a responsive HTML email template for sign-in and transactional messages.
 */
export function renderEmailTemplate({ title, content, link, linkText, footerText, appName = 'Flaregun' }) {
  const safeAppName = escapeHtml(appName)
  const safeTitle = escapeHtml(title || `Sign in to ${appName}`)
  const safeLink = link ? escapeHtml(link) : ''
  const safeLinkText = escapeHtml(linkText || `Sign In to ${appName}`)
  const safeFooter = escapeHtml(footerText || "If you didn't request this email, you can safely ignore it.")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0; overflow: hidden;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <span style="font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px;">${safeAppName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 14px; font-size: 20px; font-weight: 600; color: #0f172a;">${safeTitle}</h1>
              <div style="font-size: 15px; line-height: 24px; color: #475569; margin-bottom: 24px;">
                ${content}
              </div>
              ${
                safeLink
                  ? `<div style="text-align: center; margin: 32px 0;">
                <a href="${safeLink}" style="display: inline-block; background-color: #6750a4; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 999px;">${safeLinkText}</a>
              </div>
              <p style="font-size: 13px; line-height: 20px; color: #64748b; margin: 0 0 16px;">
                This link expires in 1 hour and can only be used once.
              </p>
              <p style="font-size: 12px; line-height: 18px; color: #94a3b8; word-break: break-all; margin: 0;">
                If the button above does not work, copy and paste this URL into your browser:<br>
                <a href="${safeLink}" style="color: #6750a4; text-decoration: underline;">${safeLink}</a>
              </p>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
              ${safeFooter}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function extractLink(opts = {}) {
  const linkMatch = String(opts.html || opts.body || '').match(/href=["']([^"']+)["']/i)
  if (linkMatch) return linkMatch[1]
  const urlMatch = String(opts.text || opts.body || '').match(/https?:\/\/[^\s"'<>]+/)
  return urlMatch ? urlMatch[0] : null
}

function stripHtmlToText(value) {
  return String(value || '')
    .replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Cloudflare Email Service mailer backed by the Workers `send_email` binding (`c.env.EMAIL`).
 */
export class CloudflareMailer {
  /**
   * @param {Object} [bindingOrEnv] - Cloudflare `send_email` binding (`c.env.EMAIL`) or `c.env` object
   * @param {Object} [opts]
   * @param {string} opts.from - Default sender address from `EMAIL_FROM` (e.g. `'Flaregun <noreply@example.com>'`)
   * @param {string} [opts.appName] - Application display name (default: `'Flaregun'`)
   * @param {Object} [opts.logger] - Logger instance with `.log()`
   */
  constructor(bindingOrEnv, opts = {}) {
    if (bindingOrEnv && typeof bindingOrEnv.send === 'function') {
      this.binding = bindingOrEnv
    } else if (bindingOrEnv && bindingOrEnv.EMAIL && typeof bindingOrEnv.EMAIL.send === 'function') {
      this.binding = bindingOrEnv.EMAIL
    } else if (bindingOrEnv && bindingOrEnv.SEND_EMAIL && typeof bindingOrEnv.SEND_EMAIL.send === 'function') {
      this.binding = bindingOrEnv.SEND_EMAIL
    } else {
      this.binding = null
    }

    this.appName = opts.appName || 'Flaregun'
    this.from = formatAppFrom(opts.from, this.appName)
    this.logger = opts.logger || console
    this.lastEmail = null
    this.lastUrl = null
  }

  /**
   * Send an email via Cloudflare Email Service.
   *
   * @param {Object} opts
   * @param {string|Array} opts.to - Recipient email address(es)
   * @param {string} [opts.from] - Override sender address
   * @param {string} [opts.subject] - Email subject line
   * @param {string} [opts.body] - HTML or plain-text body (e.g. from `passkeys`)
   * @param {string} [opts.html] - Explicit HTML body
   * @param {string} [opts.text] - Explicit plain-text body
   * @param {string|Array} [opts.cc]
   * @param {string|Array} [opts.bcc]
   * @param {string} [opts.replyTo]
   */
  async send(opts = {}) {
    const to =
      typeof opts.to === 'string'
        ? opts.to.replace(/[\r\n]+/g, '').trim()
        : Array.isArray(opts.to)
          ? opts.to.map((addr) => (typeof addr === 'string' ? addr.replace(/[\r\n]+/g, '').trim() : addr))
          : opts.to

    if (!to || (Array.isArray(to) && to.length === 0)) {
      throw new Error('Recipient email address ("to") is required')
    }

    const from = formatAppFrom(opts.from || this.from, this.appName)
    if (!from) {
      throw new Error('Sender email address ("from" or EMAIL_FROM) is required')
    }

    const subject = String(opts.subject || `Sign in to ${this.appName}`)
      .replace(/[\r\n]+/g, ' ')
      .trim()

    let html = opts.html
    let text = opts.text

    const extractedLink = extractLink(opts)
    this.lastUrl = extractedLink

    if (opts.body) {
      const isHtml = /<[a-z][\s\S]*>/i.test(opts.body)
      if (!html) {
        if (extractedLink && /sign in|verify/i.test(`${subject} ${opts.body}`)) {
          html = renderEmailTemplate({
            title: subject,
            content: `Click the button below to verify your email address and sign in to <strong>${escapeHtml(this.appName)}</strong>.`,
            link: extractedLink,
            linkText: `Sign In to ${this.appName}`,
            appName: this.appName,
          })
        } else {
          html = isHtml ? opts.body : `<p>${escapeHtml(opts.body).replace(/\n/g, '<br>')}</p>`
        }
      }
      if (!text) {
        text = stripHtmlToText(opts.body)
      }
    } else if (html && !text) {
      text = stripHtmlToText(html)
    }

    const payload = {
      to,
      from,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      ...(opts.cc ? { cc: opts.cc } : {}),
      ...(opts.bcc ? { bcc: opts.bcc } : {}),
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    }

    this.lastEmail = payload

    if (this.binding) {
      this.logger.log(`[CloudflareMailer] Sending email to ${JSON.stringify(to)}: "${subject}"`)
      return await this.binding.send(payload)
    }

    this.logger.log(`[CloudflareMailer] (No binding) to: ${JSON.stringify(to)}, from: ${from}, subject: "${subject}"`)
    return { simulated: true }
  }
}

export const Mailer = CloudflareMailer

/**
 * Fallback console mailer used when `EMAIL_FROM` is not configured.
 * Logs messages to the console instead of sending email.
 */
export class ConsoleMailer {
  constructor() {
    this.lastEmail = null
    this.lastUrl = null
  }

  async send(opts = {}) {
    this.lastUrl = extractLink(opts)
    this.lastEmail = opts
    console.log(`[ConsoleMailer] to: ${opts.to} | subject: ${opts.subject}\n${opts.body || opts.html || opts.text}`)
  }
}
