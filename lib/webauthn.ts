/**
 * BarberOS — Motor WebAuthn / Passkeys (FIDO2 / W3C Level 3)
 * 
 * Implementa registro y autenticación con Passkeys compatibles con:
 * - Autenticadores de plataforma: Windows Hello, Touch ID, Face ID.
 * - Llaves de seguridad de hardware: YubiKey, Titan Key, llaves NFC/USB.
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server'

export function getWebAuthnConfig(req?: Request) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  let host = 'localhost'

  if (req) {
    const hostHeader = req.headers.get('host') || ''
    host = hostHeader.split(':')[0]
  } else if (envUrl) {
    try {
      const u = new URL(envUrl)
      host = u.hostname
    } catch {
      // fallback
    }
  }

  const isLocal = host === 'localhost' || host === '127.0.0.1'
  const origin = isLocal ? `http://${host}:3000` : `https://${host}`
  const rpID = isLocal ? 'localhost' : host

  return {
    rpName: 'BarberOS Root Security',
    rpID,
    origin,
  }
}

export {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
}

export type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
}

