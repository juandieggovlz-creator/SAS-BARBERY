import { NextResponse } from 'next/server'
import { jwtVerify, SignJWT, JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'
import { generateTotpSecret, getTotpUri, generateTotpQrCodeDataUrl } from '@/lib/totp'
import { generateRecoveryCodes, encryptData } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const TARGET_EMAIL = 'juandieggovlz@gmail.com'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET requerido')
  return new TextEncoder().encode(secret)
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de generación MFA. Por favor utiliza la interfaz en http://localhost:3000/setup/owner',
    interfaceUrl: '/setup/owner'
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { setupToken, email, password } = body

    if (!setupToken || typeof setupToken !== 'string') {
      return NextResponse.json({ error: 'Token de configuración requerido' }, { status: 401 })
    }

    // 1. Verificar setupToken firmado
    let verifiedPayload: JWTPayload
    try {
      const res = await jwtVerify(setupToken, getJwtSecret(), { algorithms: ['HS256'] })
      verifiedPayload = res.payload
    } catch {
      return NextResponse.json({ error: 'Token de autorización expirado o inválido' }, { status: 401 })
    }

    if (verifiedPayload.purpose !== 'root_setup_authorized') {
      return NextResponse.json({ error: 'Token no autorizado para este paso' }, { status: 403 })
    }

    // 2. Verificar que no exista ya un Root Owner confirmado
    const existingOwner = await prisma.user.findFirst({
      where: {
        role: 'ROOT_PLATFORM_OWNER',
        mfaConfirmedAt: { not: null },
        isActive: true
      }
    })

    if (existingOwner) {
      return NextResponse.json({ error: 'El Propietario Raíz ya ha sido inicializado.' }, { status: 403 })
    }

    // 3. Validar email estricto
    if (!email || email.trim().toLowerCase() !== TARGET_EMAIL) {
      return NextResponse.json({
        error: `Acceso restringido: Esta inicialización solo admite la dirección oficial ${TARGET_EMAIL}.`
      }, { status: 403 })
    }

    // 4. Validar fortaleza de contraseña
    if (!password || typeof password !== 'string' || password.length < 10) {
      return NextResponse.json({
        error: 'La contraseña debe tener al menos 10 caracteres.'
      }, { status: 400 })
    }

    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasDigitOrSpecial = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

    if (!hasUpper || !hasLower || !hasDigitOrSpecial) {
      return NextResponse.json({
        error: 'La contraseña debe combinar mayúsculas, minúsculas y al menos un número o símbolo especial.'
      }, { status: 400 })
    }

    // 5. Criptografía: Hash de contraseña, Secreto TOTP y Códigos de Recuperación
    const passwordHash = await bcrypt.hash(password, 12)
    const totpSecret = generateTotpSecret(20)
    const totpUri = getTotpUri('BarberOS', TARGET_EMAIL, totpSecret)
    const qrCodeDataUrl = await generateTotpQrCodeDataUrl(totpUri)

    const { plainCodes, hashedCodes } = await generateRecoveryCodes(8)

    // Cifrar el secreto TOTP con AES-256-GCM para el token
    const encryptedSecret = encryptData(totpSecret)

    // 6. Token temporal para el paso final (expira en 15 minutos)
    const mfaSetupToken = await new SignJWT({
      purpose: 'root_setup_mfa_pending',
      email: TARGET_EMAIL,
      passwordHash,
      encryptedSecret,
      totpSecret, // Se mantiene temporalmente para validar el primer código
      hashedCodes
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(getJwtSecret())

    return NextResponse.json({
      success: true,
      qrCodeDataUrl,
      totpSecretBase32: totpSecret,
      totpUri,
      recoveryCodes: plainCodes,
      mfaSetupToken
    })
  } catch (error) {
    console.error('Error generating MFA setup:', error)
    return NextResponse.json({ error: 'Error al generar configuración de seguridad' }, { status: 500 })
  }
}

