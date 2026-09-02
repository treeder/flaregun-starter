import { Passkeys } from 'passkeys'
import { hostURL } from '../utils.js'
import { globals } from '../globals.js'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import { User } from '../data/users.js'

export async function onRequest(c) {
  let p = c.params.catchall
  console.log('CATCHALL', p)
  let passkeys = new Passkeys({
    appName: 'Flaregun',
    baseURL: `${hostURL(c)}/auth`,
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
      let reqClone = c.request.clone()
      let input = {}
      try {
        input = await reqClone.json()
      } catch (e) {}

      let res = await passkeys.create(c)

      let userId = c.data.user?.id
      if (!userId && input.userId) {
        try {
          userId = isoBase64URL.toUTF8String(input.userId)
        } catch (e) {}
      }

      if (res.status === 200 || res.ok) {
        let passkeyId = input.credential?.id
        if (passkeyId && userId) {
          let passkeyRaw = await c.env.KV.get(`passkeys-${passkeyId}`)
          if (passkeyRaw) {
            let passkeyObj = JSON.parse(passkeyRaw)
            passkeyObj.createdAt = new Date().toISOString()
            passkeyObj.name = input.name || (passkeyObj.deviceType === 'multiDevice' ? 'Passkey' : 'Security Key')
            await c.env.KV.put(`passkeys-${passkeyId}`, JSON.stringify(passkeyObj))

            let userRaw = await c.env.KV.get(`users-${userId}`)
            let userObj = userRaw ? JSON.parse(userRaw) : { id: userId, passkeys: [] }
            let existingList = userObj.passkeys || []
            if (!existingList.some((pk) => pk.id === passkeyId)) {
              existingList.push(passkeyObj)
            } else {
              existingList = existingList.map((pk) => (pk.id === passkeyId ? passkeyObj : pk))
            }
            userObj.passkeys = existingList
            await c.env.KV.put(`users-${userId}`, JSON.stringify(userObj))
          }
        }
      }
      return res
    }
    if (p[1] == 'verify') {
      return await passkeys.verify(c)
    }
    if (p[1] == 'check') {
      return await passkeys.check(c)
    }
    if (p[1] == 'list') {
      let sess = c.data.user
      if (!sess || !sess.id) {
        return Response.json({ error: { message: 'Unauthorized' } }, { status: 401 })
      }
      let userRaw = await c.env.KV.get(`users-${sess.id}`)
      let passkeysList = []
      if (userRaw) {
        let parsed = JSON.parse(userRaw)
        passkeysList = parsed.passkeys || []
      }
      return Response.json({
        passkeys: passkeysList.map((pk) => ({
          id: pk.id,
          name: pk.name || (pk.deviceType === 'multiDevice' ? 'Passkey' : 'Security Key'),
          deviceType: pk.deviceType,
          backedUp: pk.backedUp,
          createdAt: pk.createdAt || null,
          transports: pk.transports || [],
        })),
      })
    }
    if (p[1] == 'delete' || p[1] == 'remove') {
      let sess = c.data.user
      if (!sess || !sess.id) {
        return Response.json({ error: { message: 'Unauthorized' } }, { status: 401 })
      }
      let passkeyId = p[2]
      if (!passkeyId) {
        try {
          let body = await c.request.json()
          passkeyId = body.id
        } catch (e) {}
      }
      if (!passkeyId) {
        return Response.json({ error: { message: 'Passkey ID is required' } }, { status: 400 })
      }

      let userRaw = await c.env.KV.get(`users-${sess.id}`)
      if (!userRaw) {
        return Response.json({ error: { message: 'User not found' } }, { status: 404 })
      }
      let userObj = JSON.parse(userRaw)
      let existingList = userObj.passkeys || []
      if (!existingList.some((pk) => pk.id === passkeyId)) {
        return Response.json({ error: { message: 'Passkey not found for user' } }, { status: 404 })
      }

      await c.env.KV.delete(`passkeys-${passkeyId}`)
      userObj.passkeys = existingList.filter((pk) => pk.id !== passkeyId)
      await c.env.KV.put(`users-${sess.id}`, JSON.stringify(userObj))
      return Response.json({ success: true, message: 'Passkey deleted' })
    }
  }
  return Response.json({})
}
