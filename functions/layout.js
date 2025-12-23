import { html, slot } from 'rend'

export async function layout(d) {
  let title = d.title ? d.title + ' - Flaregun' : 'Flaregun Starter Kit'
  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
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
              "@lit/reactive-element": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@1/reactive-element.js",
              "@lit/reactive-element/": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@1/",
              "lit-element/lit-element.js": "https://cdn.jsdelivr.net/npm/lit-element@4/lit-element.js",
              "lit-html": "https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js",
              "lit-html/": "https://cdn.jsdelivr.net/npm/lit-html@3/",
              "material/": "https://cdn.jsdelivr.net/gh/material-esm/material@2.7.11/",
              "api": "https://cdn.jsdelivr.net/gh/treeder/api@0/api.js",
              "state": "https://cdn.jsdelivr.net/gh/treeder/state@1/state.js",
              "models": "https://cdn.jsdelivr.net/gh/treeder/models@1/index.js",
              "passkeys/": "https://cdn.jsdelivr.net/gh/treeder/passkeys@2.0.2/"
            }
          }
        </script>
      </head>
      <body>
        <script type="module">
          import 'passkeys/public/components/sign-in-button.js'
        </script>
        <div class="flex g12 jcsb mb20 topnav">
          <a href="/">
            <div class="flex g8 jcc aic">
              <img src="/images/flaregun2.png" style="height: 40px;" />
              <div class="title-large">Flaregun Starter Kit</div>
            </div>
          </a>
          <div class="flex g8 jcc aic">
            <div>
              <sign-in-button href="/signin">Sign In</sign-in-button>
            </div>
          </div>
        </div>

        ${await slot('main', d)}
      </body>
    </html> `
}
