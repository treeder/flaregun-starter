import { all } from "./styles.css.js"

export async function onRequest(c) {
  return new Response(`
  import { css } from 'lit'
  export const styles = css\`
      ${all()}
  \``, { headers: { 'Content-Type': 'text/javascript' } })
}