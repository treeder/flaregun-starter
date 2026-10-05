import { html } from 'rend'

export async function onRequestGet(c) {
  return await c.data.rend.html({
    title: 'Material 3 Demo',
    main: render,
  })
}

function render(d) {
  return html`
    <script type="module">
      import '/components/material-demo.js'
    </script>

    <div class="flex col p16 mt12">
      <material-demo></material-demo>
    </div>
  `
}
