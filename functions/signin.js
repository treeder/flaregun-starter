import { html } from 'rend'

export async function onRequestGet(c) {
  return await c.data.rend.html({
    title: 'Sign In',
    main: render,
  })
}

function render(d) {
  return html`
    <script type="module">
      import '/components/sign-in.js'
    </script>

    <div class="flex col aic jcc p16 mt40">
      <div class="headline-medium mb24">Sign In</div>
      <sign-in baseURL="/auth" afterLoginHref="/"></sign-in>
    </div>
  `
}
