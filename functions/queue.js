export async function queue(c) {
  console.log('queue called!')
  for (const message of c.batch.messages) {
    console.log('Received', message.id, message.body)
  }
}
