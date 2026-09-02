import { html } from 'rend'

export async function onRequestGet(c) {
  if (!c.data.user) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/signin?redirect=/settings',
      },
    })
  }

  return await c.data.rend.html({
    title: 'Settings',
    main: render,
  })
}

function render(d) {
  return html`
    <script type="module">
      import '/components/settings-page.js'
    </script>

    <div class="flex col aic jcc p16 mt20">
      <settings-page user="${JSON.stringify(d.user)}"></settings-page>
    </div>
  `
}
