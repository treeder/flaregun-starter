import { APIError } from 'api'
/**
 * Example for errors.
 */
export async function onRequestGet(c) {
  throw new APIError('Something went wrong', { status: 500 })
}
