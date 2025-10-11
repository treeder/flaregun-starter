import { html } from 'rend'

export async function onRequestGet(c) {
  return await c.data.rend.html({
    main: render,
  })
}

function render(d) {
  return html`
    <script type="module">
      import 'passkeys/public/components/sign-in.js'
    </script>

    <sign-in baseURL="/auth" afterLoginHref="/"></sign-in>
  `
}
