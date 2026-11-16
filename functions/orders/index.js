import { html, stringifyAttribute } from 'rend'

export async function onRequestGet(c) {
  return await c.data.rend.html({
    title: 'My Orders',
    main: render,
  })
}

function render(d) {
  const userAttr = stringifyAttribute(d.user)

  return html`
    <script type="module">
      import '/components/orders-page.js'
    </script>

    <div class="flex col g20 p16" style="max-width: 960px; margin: 0 auto;">
      <orders-page user="${userAttr}"></orders-page>
    </div>
  `
}
