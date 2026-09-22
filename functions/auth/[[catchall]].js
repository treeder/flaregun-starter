import { Passkeys } from 'passkeys'
import { hostURL, domainLevels } from '../utils.js'
import { globals } from '../globals.js'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import { User } from '../data/users.js'

export async function onRequest(c) {
  let p = c.params.catchall
  console.log('CATCHALL', p)
  let passkeys = new Passkeys({
    appName: 'Flaregun',
    baseURL: `${hostURL(c)}/auth`,
    domainLevels: domainLevels(c),
    kv: c.env.KV,
    // mailer: globals.mailer, // replace with your own mailer instance with send() function
    logger: c.data.logger,
    emailStart: async ({ email }) => {
      let normalized = (email || '').toLowerCase().trim()
      let user = await c.data.d1.first(User, { where: { email: normalized } })
      if (!user) {
        user = await c.data.d1.insert(User, {
          email: normalized,
          name: normalized.split('@')[0],
        })
      }
      return { userId: user.id }
    },
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
    if (p[1] == 'list') {
      return await passkeys.list(c)
    }
    if (p[1] == 'delete' || p[1] == 'remove') {
      return await passkeys.delete(c)
    }
  }

  return Response.json({})
}
