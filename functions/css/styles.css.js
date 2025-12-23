/**
 * We have CSS in JS files so that they can be used in web components.
 */

import { css } from 'rend'

export async function onRequestGet(c) {
  return new Response(root({}), {
    headers: {
      'content-type': 'text/css;charset=UTF-8',
    },
  })
}

export function root(d) {
  return css`
    @import url(light.css) (prefers-color-scheme: light);
    @import url(dark.css) (prefers-color-scheme: dark);

    :root {
      --md-ref-typeface-brand: 'Google Sans Flex', sans-serif;
      --md-ref-typeface-plain: 'Google Sans Flex', sans-serif;

      font-family: var(--md-ref-typeface-plain);
      font-size: 14px;

      background: var(--md-sys-color-background);
      color: var(--md-sys-color-on-background);
    }

    .topnav a {
      color: var(--md-sys-color-on-background);
    }

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
      color: var(--success-color);
    }

    .red,
    .error {
      color: var(--error-color);
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

    .pt12 {
      padding-top: 12px;
    }
    .pt40 {
      padding-top: 40px;
    }

    .pb40 {
      padding-bottom: 40px;
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
      color: #8492a6 !important;
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
      color: var(--md-sys-color-on-primary);
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
