// Refresh tokens are encrypted at rest with AES-256-GCM under
// YOUTUBE_TOKEN_KEY (32 random bytes, base64). OAuth state is signed with an
// HMAC under the same key so a callback cannot be forged or replayed late.
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
const fromBase64url = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0))

function keyBytes(secret: string): Uint8Array<ArrayBuffer> {
  let bytes: Uint8Array<ArrayBuffer>
  try {
    bytes = Uint8Array.from(atob(secret), char => char.charCodeAt(0))
  } catch {
    throw new Error('YOUTUBE_TOKEN_KEY must be base64')
  }
  if (bytes.length !== 32) throw new Error('YOUTUBE_TOKEN_KEY must be 32 bytes of base64')
  return bytes
}

const aesKey = (secret: string) => crypto.subtle.importKey('raw', keyBytes(secret), 'AES-GCM', false, ['encrypt', 'decrypt'])
const hmacKey = async (secret: string) => {
  // Separate the signing key from the encryption key.
  const derived = await crypto.subtle.digest('SHA-256', new Uint8Array([...keyBytes(secret), ...encoder.encode('oauth-state')]))
  return crypto.subtle.importKey('raw', derived, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function encryptToken(secret: string, plaintext: string, context: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  // The channel id is bound as associated data, so a token cannot be swapped between rows.
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(context) }, await aesKey(secret), encoder.encode(plaintext)))
  return `v1.${base64url(iv)}.${base64url(ciphertext)}`
}

export async function decryptToken(secret: string, sealed: string, context: string): Promise<string> {
  const [version, iv, ciphertext] = sealed.split('.')
  if (version !== 'v1' || !iv || !ciphertext) throw new Error('Unknown token format')
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64url(iv), additionalData: encoder.encode(context) }, await aesKey(secret), fromBase64url(ciphertext))
  return decoder.decode(plaintext)
}

export type OAuthState = { channel: number; nonce: string; expiresAt: number }

export async function signState(secret: string, state: OAuthState): Promise<string> {
  const body = base64url(encoder.encode(JSON.stringify(state)))
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(body)))
  return `${body}.${base64url(signature)}`
}

export async function verifyState(secret: string, value: string, nonce: string | null, now = Date.now()): Promise<OAuthState> {
  const [body, signature] = value.split('.')
  if (!body || !signature) throw new Error('Malformed state')
  const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromBase64url(signature), encoder.encode(body))
  if (!valid) throw new Error('State signature is invalid')
  const state = JSON.parse(decoder.decode(fromBase64url(body))) as OAuthState
  if (!Number.isSafeInteger(state.channel) || typeof state.nonce !== 'string' || typeof state.expiresAt !== 'number') throw new Error('Malformed state')
  if (state.expiresAt < now) throw new Error('Connection request expired; start again')
  // The nonce cookie ties the callback to the browser that started it.
  if (!nonce || nonce !== state.nonce) throw new Error('Connection was started in a different browser session')
  return state
}

export const randomNonce = () => base64url(crypto.getRandomValues(new Uint8Array(18)))
