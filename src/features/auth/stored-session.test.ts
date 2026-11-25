import { describe, expect, it } from 'vitest'
import { parseStoredUser } from './stored-session'

describe('parseStoredUser', () => {
  it('devuelve el usuario de una sesión guardada válida', () => {
    const raw = JSON.stringify({
      access_token: 'a',
      refresh_token: 'r',
      expires_at: 0,
      user: { id: 'u1', email: 'a@b.com', user_metadata: { display_name: 'Julius' } },
    })
    expect(parseStoredUser(raw)).toEqual({
      id: 'u1',
      email: 'a@b.com',
      created_at: undefined,
      user_metadata: { display_name: 'Julius' },
    })
  })

  it('devuelve null si no hay sesión, está corrupta o le falta el refresh token', () => {
    expect(parseStoredUser(null)).toBeNull()
    expect(parseStoredUser('no-json')).toBeNull()
    expect(parseStoredUser(JSON.stringify({ user: { id: 'u1' } }))).toBeNull()
    expect(parseStoredUser(JSON.stringify({ refresh_token: 'r', user: {} }))).toBeNull()
  })
})
