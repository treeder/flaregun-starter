import { html } from 'rend'

export async function onRequestGet(c) {
  if (!c.data.user) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/signin?redirect=/settings/flags',
      },
    })
  }

  return await c.data.rend.html({
    title: 'Flags',
    main: render,
  })
}

function render(d) {
  return html`
    <script type="module">
      import '/components/flags-page.js'
    </script>

    <div class="flex col aic jcc p16 mt20">
      <flags-page user="${JSON.stringify(d.user).replace(/"/g, '&quot;')}"></flags-page>
    </div>
  `
}
