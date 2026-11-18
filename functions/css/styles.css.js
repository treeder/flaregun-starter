/**
 * We have CSS in JS files so that they can be used in web components.
 */

import { css } from 'rend'
import { landingStyles } from './landing.css.js'

export async function onRequestGet(c) {
  return new Response(root({}), {
    headers: {
      'content-type': 'text/css;charset=UTF-8',
    },
  })
}

export function root(d) {
  return css`
    @import url(light.css);
    @import url(dark.css) (prefers-color-scheme: dark);

    :root {
      --md-ref-typeface-brand: 'Google Sans Flex', sans-serif;
      --md-ref-typeface-plain: 'Google Sans Flex', sans-serif;

      font-family: var(--md-ref-typeface-plain);
      font-size: 14px;

      background: var(--md-sys-color-background);
      color: var(--md-sys-color-on-background);

      --md-card-container-color: var(--md-sys-color-surface, #ffffff);
    }

    body {
      background: var(--md-sys-color-background, #f8f9fa);
      margin: 0;
      min-height: 100vh;
      min-block-size: 100dvh;
      display: flex;
      flex-direction: column;
    }

    .page-main {
      flex: 1 0 auto;
      inline-size: 100%;
      padding-block-end: 48px;
    }

    .topnav {
      padding: 16px;
    }

    .topnav a {
      color: var(--md-sys-color-on-background);
    }

    .nav-item {
      font-weight: 500;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      padding: 6px 12px;
      border-radius: 8px;
      text-decoration: none;
      transition:
        background-color 0.15s ease,
        color 0.15s ease;
    }

    .nav-item:hover {
      background: var(--md-sys-color-surface-container-high, rgba(0, 0, 0, 0.05));
      color: var(--md-sys-color-on-surface);
    }

    .nav-item.active {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
    }

    .site-footer {
      margin-block-start: auto;
      background: var(--md-sys-color-surface-container-low, #f1f4f9);
      color: var(--md-sys-color-on-surface);
      border-block-start: 1px solid var(--md-sys-color-outline-variant, #c2c7ce);
    }

    .site-footer-inner {
      max-inline-size: 1160px;
      margin-inline: auto;
      padding-block: 48px 28px;
      padding-inline: 24px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .site-footer-grid {
      display: grid;
      grid-template-columns: minmax(240px, 1.7fr) repeat(3, minmax(140px, 1fr));
      gap: 32px;
    }

    @media (width < 840px) {
      .site-footer-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 24px;
      }

      .site-footer-brand-col {
        grid-column: 1 / -1;
      }
    }

    .site-footer-brand-col {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      min-inline-size: 0;
    }

    .footer-brand {
      display: inline-flex;
      align-items: safe center;
      gap: 10px;
      color: var(--md-sys-color-on-surface);
      text-decoration: none;
    }

    .footer-logo {
      display: block;
      inline-size: 30px;
      block-size: 32px;
      aspect-ratio: 269 / 285;
    }

    .footer-brand-title {
      font-weight: 600;
    }

    .footer-tagline {
      margin: 0;
      max-inline-size: 38ch;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.6;
    }

    .footer-badge {
      display: inline-flex;
      align-items: safe center;
      gap: 6px;
      margin-block-start: 4px;
      padding-block: 5px;
      padding-inline: 12px;
      border-radius: 999px;
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      font-size: 12px;
      font-weight: 500;
    }

    .footer-badge md-icon {
      font-size: 16px;
    }

    .footer-nav {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-inline-size: 0;
    }

    .footer-heading {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface);
    }

    .footer-links {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .footer-links a {
      display: inline-flex;
      align-items: safe center;
      gap: 6px;
      padding-block: 2px;
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .footer-links a:hover,
    .footer-links a:focus-visible,
    .footer-links a[aria-current='page'] {
      color: var(--md-sys-color-primary);
    }

    .footer-links a[aria-current='page'] {
      font-weight: 500;
    }

    .footer-links code {
      font-size: 12px;
      padding-block: 1px;
      padding-inline: 5px;
      border-radius: 4px;
      background: var(--md-sys-color-surface-container-high, rgba(0, 0, 0, 0.06));
      color: var(--md-sys-color-on-surface);
    }

    .site-footer-bottom {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: safe center;
      gap: 12px 24px;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 13px;
    }

    .footer-copyright {
      margin: 0;
    }

    .footer-bottom-links {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      flex-wrap: balance;
      align-items: safe center;
      gap: 8px 16px;
    }

    .footer-bottom-links a {
      display: inline-flex;
      align-items: safe center;
      gap: 6px;
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.15s ease;
    }

    .footer-bottom-links a:hover,
    .footer-bottom-links a:focus-visible {
      color: var(--md-sys-color-primary);
    }

    .footer-bottom-links md-icon {
      font-size: 16px;
    }

    ${landingStyles()}
    ${all(d)}
  `
}

export function all(d) {
  return css`
    a {
      color: var(--md-sys-color-secondary);
      text-decoration: none;
    }

    .slightly-opaque {
      background-color: rgb(0 0 0 / 0.3);
    }

    .green,
    .success {
      color: var(--success-color, #2e7d32);
    }

    .red,
    .error {
      color: var(--error-color, var(--md-sys-color-error, #ba1a1a));
    }

    .flex {
      display: flex;
    }

    .flexr {
      display: flex;
    }

    .flexw {
      display: flex;
      flex-wrap: wrap;
    }

    .grid {
      display: grid;
    }

    /* https://m3.material.io/foundations/layout/applying-layout/window-size-classes */
    @media (width < 840px) {
      .flexr {
        flex-direction: column;
      }

      .mobOrder1 {
        order: -100;
      }

      .mobOrder2 {
        order: -50;
      }

      .mobOrder3 {
        order: -20;
      }

      .lteMedium {
        display: block;
      }

      .gtMedium {
        /* aka expanded */
        display: none;
      }
    }

    @media (width >=840px) {
      .gtMedium {
        display: block;
      }

      .lteMedium {
        display: none;
      }
    }

    .row {
      flex-direction: row;
    }

    .col {
      flex-direction: column;
    }

    .jcc {
      justify-content: center;
    }

    .jcsb {
      justify-content: space-between;
    }

    .jcse {
      justify-content: space-evenly;
    }

    .jce {
      justify-content: end;
    }

    .aic {
      align-items: center;
    }

    .rc4 {
      border-radius: 4px;
    }

    .a2 {
      text-decoration: none;
      color: white;
    }

    /* .a2:hover {
    text-decoration: underline;
  } */

    .g8 {
      gap: 8px;
    }

    .g12 {
      gap: 12px;
    }

    .g16 {
      gap: 16px;
    }

    .g20 {
      gap: 20px;
    }

    .g24 {
      gap: 24px;
    }
    .g32 {
      gap: 32px;
    }

    .p4 {
      padding: 4px;
    }
    .p8 {
      padding: 8px;
    }
    .p12 {
      padding: 12px;
    }
    .p16 {
      padding: 16px;
    }
    .p20 {
      padding: 20px;
    }
    .p24 {
      padding: 24px;
    }

    .pt12 {
      padding-top: 12px;
    }
    .pt40 {
      padding-top: 40px;
    }

    .pb40 {
      padding-bottom: 40px;
    }

    .mt8 {
      margin-top: 8px;
    }

    .mt12 {
      margin-top: 12px;
    }

    .mt16 {
      margin-top: 16px;
    }

    .mt20 {
      margin-top: 20px;
    }

    .mt24 {
      margin-top: 24px;
    }
    .mt32 {
      margin-top: 32px;
    }
    .mt48 {
      margin-top: 48px;
    }

    .mb8 {
      margin-bottom: 8px;
    }

    .mb12 {
      margin-bottom: 12px;
    }

    .mb16 {
      margin-bottom: 16px;
    }

    .mb20 {
      margin-bottom: 20px;
    }

    .mb24 {
      margin-bottom: 24px;
    }

    .tac {
      text-align: center;
    }

    .w100 {
      width: 100%;
    }

    .shadow {
      box-shadow: 0 0 3px rgba(255, 255, 255, 0.15) !important;
    }

    .bg-light {
      background-color: #151c2b !important;
    }

    .br4 {
      border-radius: 4px;
    }

    .br8 {
      border-radius: 8px;
    }
    .br50 {
      border-radius: 50%;
    }
    .wh36 {
      height: 36px;
      width: 36px;
    }

    .text-muted {
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .text-center {
      text-align: center;
    }
    .text-end {
      text-align: end;
    }
    .small {
      font-size: smaller;
    }

    .card {
      background-color: var(--md-card-container-color, var(--md-sys-color-surface, #ffffff));
      color: var(--md-sys-color-on-surface);
      border-radius: var(--md-card-container-shape, 12px);
      border: var(--md-card-outline-width, 1px) solid
        var(--md-card-outline-color, var(--md-sys-color-outline-variant, #cac4d0));
    }

    md-card {
      --md-card-container-color: var(--md-sys-color-surface, #ffffff);
    }

    ${typography()}
  `
}

function typography() {
  return css`
    .display-medium {
      font-weight: 400;
      font-size: 45px;
      line-height: 52px;
    }

    .headline-small {
      font-weight: 400;
      font-size: 24px;
      line-height: 32px;
    }
    .headline-medium {
      font-weight: 400;
      font-size: 28px;
      line-height: 36px;
    }

    .title-medium {
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 0.15px;
      line-height: 24px;
    }

    .title-large {
      font-size: 22px;
      font-weight: 400;
      letter-spacing: 0px;
      line-height: 28px;
    }
  `
}
