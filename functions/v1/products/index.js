export async function onRequestPost(c) {
  let input = await c.request.json()
  let product = input.product
  product.data = {
    x: "json field", // just to show using JSON fields
  }
  await c.data.d1.insert("products", product)
  return Response.json({ product })
}