import { html } from 'rend'

export async function onRequestGet(c) {
  let afterLoginHref = '/'
  if (c.request) {
    try {
      const url = new URL(c.request.url)
      const redirect = url.searchParams.get('redirect')
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        afterLoginHref = redirect
      }
    } catch (e) {}
  }

  return await c.data.rend.html({
    title: 'Sign In',
    main: render,
    afterLoginHref,
  })
}

function render(d) {
  const href = d.afterLoginHref || '/'
  return html`
    <script type="module">
      import '/components/sign-in.js'
    </script>

    <div class="flex col aic jcc p16 mt40">
      <div class="headline-medium mb24">Sign In</div>
      <sign-in baseURL="/auth" afterLoginHref="${href}"></sign-in>
    </div>
  `
}
