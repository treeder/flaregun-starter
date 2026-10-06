import { test, expect } from 'vitest'
import { baseUrl as defaultBaseURL } from './helper.js'

test('Settings Flags page and user.data.flags integration tests', async () => {
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

  // 5. Initial GET /v1/users/me/flags returns empty flags
  const initialFlagsRes = await fetch(`${baseURL}/v1/users/me/flags`, {
    headers: { Cookie: cookieHeader },
  })
  expect(initialFlagsRes.status).toBe(200)
  const initialFlagsData = await initialFlagsRes.json()
  expect(initialFlagsData.flags).toEqual([])

  // 6. Add a flag "beta_feature" via POST /v1/users/me/flags
  const addFlagRes = await fetch(`${baseURL}/v1/users/me/flags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ flag: 'beta_feature' }),
  })
  expect(addFlagRes.status).toBe(200)
  const addFlagData = await addFlagRes.json()
  expect(addFlagData.flags).toEqual(['beta_feature'])
  expect(addFlagData.user.data.flags).toEqual(['beta_feature'])

  // 7. Add another flag "dark_mode"
  const addSecondFlagRes = await fetch(`${baseURL}/v1/users/me/flags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ flag: 'dark_mode' }),
  })
  expect(addSecondFlagRes.status).toBe(200)
  const addSecondFlagData = await addSecondFlagRes.json()
  expect(addSecondFlagData.flags).toEqual(['beta_feature', 'dark_mode'])

  // Verify adding an existing flag does not duplicate it
  const addDupFlagRes = await fetch(`${baseURL}/v1/users/me/flags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ flag: 'beta_feature' }),
  })
  expect(addDupFlagRes.status).toBe(200)
  const addDupFlagData = await addDupFlagRes.json()
  expect(addDupFlagData.flags).toEqual(['beta_feature', 'dark_mode'])

  // 8. Verify GET /v1/users/me reflects user.data.flags in database
  const meRes = await fetch(`${baseURL}/v1/users/me`, {
    headers: { Cookie: cookieHeader },
  })
  expect(meRes.status).toBe(200)
  const meData = await meRes.json()
  expect(meData.user.data.flags).toEqual(['beta_feature', 'dark_mode'])

  // 9. Delete flag "beta_feature" via DELETE /v1/users/me/flags with JSON body
  const deleteFlagRes = await fetch(`${baseURL}/v1/users/me/flags`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ flag: 'beta_feature' }),
  })
  expect(deleteFlagRes.status).toBe(200)
  const deleteFlagData = await deleteFlagRes.json()
  expect(deleteFlagData.flags).toEqual(['dark_mode'])
  expect(deleteFlagData.user.data.flags).toEqual(['dark_mode'])

  // 10. Delete flag "dark_mode" via DELETE /v1/users/me/flags with query parameter
  const deleteSecondFlagRes = await fetch(`${baseURL}/v1/users/me/flags?flag=dark_mode`, {
    method: 'DELETE',
    headers: { Cookie: cookieHeader },
  })
  expect(deleteSecondFlagRes.status).toBe(200)
  const deleteSecondFlagData = await deleteSecondFlagRes.json()
  expect(deleteSecondFlagData.flags).toEqual([])
  expect(deleteSecondFlagData.user.data.flags).toEqual([])

  // 11. Verify GET /v1/users/me reflects empty flags array
  const meEmptyRes = await fetch(`${baseURL}/v1/users/me`, {
    headers: { Cookie: cookieHeader },
  })
  expect(meEmptyRes.status).toBe(200)
  const meEmptyData = await meEmptyRes.json()
  expect(meEmptyData.user.data.flags).toEqual([])

  // 12. Batch set flags via { flags: [...] }
  const batchRes = await fetch(`${baseURL}/v1/users/me/flags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ flags: ['flag_1', 'flag_2', 'flag_3'] }),
  })
  expect(batchRes.status).toBe(200)
  const batchData = await batchRes.json()
  expect(batchData.flags).toEqual(['flag_1', 'flag_2', 'flag_3'])

  // 13. Verify direct update to user.data via /v1/users/me also works and persists
  const directUpdateRes = await fetch(`${baseURL}/v1/users/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ user: { data: { flags: ['custom_feature'] } } }),
  })
  expect(directUpdateRes.status).toBe(200)
  const directUpdateData = await directUpdateRes.json()
  expect(directUpdateData.user.data.flags).toEqual(['custom_feature'])

  // Verify GET /v1/users/me/flags reflects the updated flag
  const finalFlagsRes = await fetch(`${baseURL}/v1/users/me/flags`, {
    headers: { Cookie: cookieHeader },
  })
  expect(finalFlagsRes.status).toBe(200)
  const finalFlagsData = await finalFlagsRes.json()
  expect(finalFlagsData.flags).toEqual(['custom_feature'])
})
