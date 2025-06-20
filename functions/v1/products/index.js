export async function onRequestPost(c) {
  let input = await c.request.json()
  let product = input.product
  await c.data.d1.insert("products", product)
  return Response.json({ product })
}