import { test, expect } from 'vitest'
import { baseUrl as defaultBaseURL } from './helper.js'

test('Settings Flags page and user.data.flags json_patch integration tests', async () => {
  const baseURL = defaultBaseURL

  // 1. Unauthenticated request to /settings/flags redirects to signin
  const unauthRes = await fetch(`${baseURL}/settings/flags`, { redirect: 'manual' })
  expect(unauthRes.status).toBe(302)
  expect(unauthRes.headers.get('location')).toBe('/signin?redirect=/settings/flags')

  // 2. Authenticate user via email magic link flow
  const email = `test-flags-${Date.now()}@example.com`
  const startRes = await fetch(`${baseURL}/auth/email/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  expect(startRes.status).toBe(200)
  const startData = await startRes.json()
  expect(startData.link).toBeDefined()

  // Follow the verification link to obtain auth session cookies
  const verifyRes = await fetch(startData.link, { redirect: 'manual' })
  expect(verifyRes.status).toBe(302)

  const setCookieHeaders = verifyRes.headers.getSetCookie?.() || [verifyRes.headers.get('set-cookie')].filter(Boolean)
  const cookieHeader = setCookieHeaders.map((c) => c.split(';')[0]).join('; ')
  expect(cookieHeader).toContain('session=')

  // 3. Authenticated request to /settings/flags returns 200 with flags-page component
  const flagsPageRes = await fetch(`${baseURL}/settings/flags`, {
    headers: { Cookie: cookieHeader },
  })
  expect(flagsPageRes.status).toBe(200)
  const flagsPageHtml = await flagsPageRes.text()
  expect(flagsPageHtml).toContain('Flags - Flaregun')
  expect(flagsPageHtml).toContain('<flags-page')
  expect(flagsPageHtml).toContain('/components/flags-page.js')

  // 4. Verify /settings/flags is not linked in navigation/menus
  const avatarMenuRes = await fetch(`${baseURL}/components/avatar-menu.js`)
  expect(avatarMenuRes.status).toBe(200)
  const avatarMenuJs = await avatarMenuRes.text()
  expect(avatarMenuJs).not.toContain('/settings/flags')

  const settingsPageRes = await fetch(`${baseURL}/components/settings-page.js`)
  expect(settingsPageRes.status).toBe(200)
  const settingsPageJs = await settingsPageRes.text()
  expect(settingsPageJs).not.toContain('/settings/flags')

  // 5. Initial GET /v1/users/me returns empty/undefined flags
  const initialMeRes = await fetch(`${baseURL}/v1/users/me`, {
    headers: { Cookie: cookieHeader },
  })
  expect(initialMeRes.status).toBe(200)
  const initialMeData = await initialMeRes.json()
  expect(initialMeData.user.data?.flags || {}).toEqual({})

  // 6. Add a flag "beta_feature" via POST /v1/users/me with { user: { data: { flags: { beta_feature: true } } } }
  const addFlagRes = await fetch(`${baseURL}/v1/users/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ user: { data: { flags: { beta_feature: true } } } }),
  })
  expect(addFlagRes.status).toBe(200)
  const addFlagData = await addFlagRes.json()
  expect(addFlagData.user.data.flags).toEqual({ beta_feature: true })

  // 7. Add another flag "dark_mode" via json_patch merge
  const addSecondFlagRes = await fetch(`${baseURL}/v1/users/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ user: { data: { flags: { dark_mode: true } } } }),
  })
  expect(addSecondFlagRes.status).toBe(200)
  const addSecondFlagData = await addSecondFlagRes.json()
  expect(addSecondFlagData.user.data.flags).toEqual({ beta_feature: true, dark_mode: true })

  // 8. Verify GET /v1/users/me reflects both flags in database
  const meRes = await fetch(`${baseURL}/v1/users/me`, {
    headers: { Cookie: cookieHeader },
  })
  expect(meRes.status).toBe(200)
  const meData = await meRes.json()
  expect(meData.user.data.flags).toEqual({ beta_feature: true, dark_mode: true })

  // 9. Delete flag "beta_feature" via json_patch null deletion
  const deleteFlagRes = await fetch(`${baseURL}/v1/users/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ user: { data: { flags: { beta_feature: null } } } }),
  })
  expect(deleteFlagRes.status).toBe(200)
  const deleteFlagData = await deleteFlagRes.json()
  expect(deleteFlagData.user.data.flags).toEqual({ dark_mode: true })

  // 10. Delete flag "dark_mode" via json_patch null deletion
  const deleteSecondFlagRes = await fetch(`${baseURL}/v1/users/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ user: { data: { flags: { dark_mode: null } } } }),
  })
  expect(deleteSecondFlagRes.status).toBe(200)
  const deleteSecondFlagData = await deleteSecondFlagRes.json()
  expect(deleteSecondFlagData.user.data.flags).toEqual({})

  // 11. Verify GET /v1/users/me reflects empty flags
  const meEmptyRes = await fetch(`${baseURL}/v1/users/me`, {
    headers: { Cookie: cookieHeader },
  })
  expect(meEmptyRes.status).toBe(200)
  const meEmptyData = await meEmptyRes.json()
  expect(meEmptyData.user.data.flags).toEqual({})

  // 12. Wrapped user payload also works: { user: { data: { flags: { my_flag: true } } } }
  const wrappedRes = await fetch(`${baseURL}/v1/users/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ user: { data: { flags: { my_flag: true } } } }),
  })
  expect(wrappedRes.status).toBe(200)
  const wrappedData = await wrappedRes.json()
  expect(wrappedData.user.data.flags).toEqual({ my_flag: true })

  // 13. Verify unwrapped payload returns 400 Bad Request
  const unwrappedRes = await fetch(`${baseURL}/v1/users/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ data: { flags: { fail: true } } }),
  })
  expect(unwrappedRes.status).toBe(400)

  // 14. Verify no separate /v1/users/me/flags endpoint exists
  const noSeparateEndpointRes = await fetch(`${baseURL}/v1/users/me/flags`, {
    headers: { Cookie: cookieHeader },
  })
  expect(noSeparateEndpointRes.status).toBe(404)
})
