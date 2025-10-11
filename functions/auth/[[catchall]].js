import { Passkeys } from 'passkeys'
import { hostURL } from '../utils.js'
import { globals } from '../globals.js'

export async function onRequest(c) {
  let p = c.params.catchall
  console.log('CATCHALL', p)
  let passkeys = new Passkeys({
    appName: 'Passkeys demo',
    baseURL: `${hostURL(c)}/auth`,
    kv: c.env.KV,
    // mailer: globals.mailer, // replace with your own mailer instance with send() function
    logger: c.data.logger,
  })

  if (p[0] == 'email') {
    if (p[1] == 'start') {
      return await passkeys.emailStart(c)
    }
    if (p[1] == 'verify') {
      return await passkeys.emailVerify(c)
    }
  } else if (p[0] == 'passkeys') {
    if (p[1] == 'new') {
      return await passkeys.new(c)
    }
    if (p[1] == 'start') {
      return await passkeys.start(c)
    }
    if (p[1] == 'create') {
      return await passkeys.create(c)
    }
    if (p[1] == 'verify') {
      return await passkeys.verify(c)
    }
    if (p[1] == 'check') {
      return await passkeys.check(c)
    }
  }
  return Response.json({})
}
