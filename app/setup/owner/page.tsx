'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock
} from 'lucide-react'
import Link from 'next/link'

export default function OwnerSetupPage() {
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [setupAvailable, setSetupAvailable] = useState(false)
  const [targetEmail, setTargetEmail] = useState('juandieggovlz@gmail.com')

  // Wizard state
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Step 1: Authorization
  const [secret, setSecret] = useState('')
  const [setupToken, setSetupToken] = useState<string | null>(null)

  // Step 2: Password
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 3 & 4: MFA & Recovery Codes
  const [mfaData, setMfaData] = useState<{
    qrCodeDataUrl: string
    totpSecretBase32: string
    totpUri: string
    recoveryCodes: string[]
    mfaSetupToken: string
  } | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false)

  // 1. Check if setup is available on mount
  useEffect(() => {
    fetch('/api/setup/owner/status')
      .then((r) => r.json())
      .then((data) => {
        setSetupAvailable(Boolean(data.setupAvailable))
        if (data.targetEmail) setTargetEmail(data.targetEmail)
      })
      .catch(() => setSetupAvailable(false))
      .finally(() => setCheckingStatus(false))
  }, [])

  // Password strength calculation
  const getPasswordStrength = () => {
    let score = 0
    if (password.length >= 10) score += 1
    if (password.length >= 14) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1
    return score
  }

  const passwordStrength = getPasswordStrength()

  // Handler Step 1: Verify secret
  const handleVerifySecret = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)

    try {
      const res = await fetch('/api/setup/owner/verify-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secret.trim() })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error de autorización')
      }

      setSetupToken(data.setupToken)
      setStep(2)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al validar el secreto de autorización.')
    } finally {
      setLoading(false)
    }
  }

  // Handler Step 2: Validate password and generate MFA
  const handleGenerateMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    if (passwordStrength < 3) {
      setErrorMessage('La contraseña debe tener al menos 10 caracteres e incluir mayúsculas, minúsculas y números o símbolos.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/setup/owner/generate-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setupToken,
          email: targetEmail,
          password
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error generando configuración de seguridad')
      }

      setMfaData(data)
      setStep(3)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al preparar seguridad MFA.')
    } finally {
      setLoading(false)
    }
  }

  // Handler Step 3 -> 4: Move to recovery codes
  const handleProceedToCodes = (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpCode || totpCode.trim().length !== 6) {
      setErrorMessage('Ingresa el código de 6 dígitos de tu aplicación para continuar.')
      return
    }
    setErrorMessage(null)
    setStep(4)
  }

  // Handler Step 4: Complete setup
  const handleCompleteSetup = async () => {
    if (!recoveryConfirmed) {
      setErrorMessage('Debes confirmar que has guardado tus códigos de recuperación.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/setup/owner/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaSetupToken: mfaData?.mfaSetupToken,
          totpCode: totpCode.trim(),
          recoveryCodesConfirmed: true
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al finalizar configuración')
      }

      // Éxito: Redirigir al dashboard
      window.location.href = data.redirect || '/superadmin/dashboard'
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al completar la inicialización.')
      setLoading(false)
    }
  }

  const handleCopySecret = () => {
    if (!mfaData?.totpSecretBase32) return
    navigator.clipboard.writeText(mfaData.totpSecretBase32)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleCopyAllCodes = () => {
    if (!mfaData?.recoveryCodes) return
    navigator.clipboard.writeText(mfaData.recoveryCodes.join('\n'))
    setCopiedCodes(true)
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  const handleDownloadCodes = () => {
    if (!mfaData?.recoveryCodes) return
    const text = `BARBEROS — CÓDIGOS DE RECUPERACIÓN DE EMERGENCIA\nPropietario: ${targetEmail}\nFecha: ${new Date().toLocaleString()}\n\n` +
      mfaData.recoveryCodes.map((c, i) => `[${i + 1}] ${c}`).join('\n') +
      `\n\nCada código solo puede usarse UNA sola vez si pierdes acceso a tu app autenticadora.`

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barberos-recovery-codes-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // Setup already locked
  if (!setupAvailable) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-white mb-2">Inicialización Bloqueada</h1>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            La plataforma BarberOS ya cuenta con un <span className="text-white font-semibold">Propietario Raíz (Root Platform Owner)</span> activo y asegurado.
          </p>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl mb-6 text-xs text-zinc-400 text-left">
            Por motivos de seguridad, el procedimiento de configuración inicial es de <span className="text-amber-400 font-semibold">un solo uso</span> y se deshabilita permanentemente una vez activada la identidad principal.
          </div>
          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            Ir al Inicio de Sesión
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-center items-center p-4 sm:p-6 py-12">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Configuración Soberana de Seguridad
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          Barber<span className="text-amber-500">OS</span> Owner Setup
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Inicialización oficial del Propietario Raíz (<code className="text-amber-400">ROOT_PLATFORM_OWNER</code>)
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-[#121215] border border-zinc-800/80 rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800/60">
          {[
            { num: 1, label: 'Autorización' },
            { num: 2, label: 'Contraseña' },
            { num: 3, label: 'TOTP MFA' },
            { num: 4, label: 'Recuperación' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-colors ${
                  step === s.num
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : step > s.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${step === s.num ? 'text-white' : 'text-zinc-500'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* ── STEP 1: AUTORIZACIÓN DE SERVIDOR ── */}
        {step === 1 && (
          <form onSubmit={handleVerifySecret} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Correo Oficial Autorizado
              </label>
              <input
                type="email"
                value={targetEmail}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-mono cursor-not-allowed"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                La inicialización de Root Owner está estrictamente reservada para este correo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Secreto de Inicialización del Servidor (<code className="text-amber-400">OWNER_SETUP_SECRET</code>)
              </label>
              <input
                type="password"
                required
                placeholder="Pega el secreto temporal del servidor..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-sm font-mono transition-all"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Disponible de forma privada en el archivo de entorno del servidor. Protegido contra fuerza bruta.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !secret.trim()}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando autorización...
                </>
              ) : (
                <>
                  Continuar a Contraseña
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── STEP 2: CONTRASEÑA MAESTRA ── */}
        {step === 2 && (
          <form onSubmit={handleGenerateMfa} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Crear Contraseña del Propietario
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 10 caracteres..."
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`flex-1 rounded-full transition-colors ${
                          passwordStrength >= lvl
                            ? passwordStrength <= 2
                              ? 'bg-rose-500'
                              : passwordStrength <= 3
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[11px] text-zinc-400 flex justify-between">
                    <span>
                      Fortaleza:{' '}
                      <span className="font-semibold text-white">
                        {passwordStrength <= 2 ? 'Débil' : passwordStrength <= 3 ? 'Aceptable' : 'Excelente'}
                      </span>
                    </span>
                    <span>Min. 10 chars, mayúsculas, minúsculas, números y símbolos</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Confirmar Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-sm transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading || password.length < 10 || password !== confirmPassword}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando llaves MFA...
                  </>
                ) : (
                  <>
                    Continuar a Segundo Factor (MFA)
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: VINCULAR TOTP ── */}
        {step === 3 && mfaData && (
          <form onSubmit={handleProceedToCodes} className="space-y-6">
            <div className="text-center">
              <div className="inline-block p-3 bg-white rounded-2xl shadow-xl mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mfaData.qrCodeDataUrl}
                  alt="QR Code TOTP"
                  className="w-44 h-44 object-contain"
                />
              </div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Escanea este código con <span className="text-white font-semibold">Google Authenticator</span>, <span className="text-white font-semibold">Microsoft Authenticator</span> o tu gestor de contraseñas.
              </p>
            </div>

            {/* Secret key toggle/copy */}
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Clave Secreta Base32 (Entrada manual):</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <Copy className="w-3 h-3" />
                  {copiedKey ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="font-mono text-xs text-white tracking-wider break-all select-all">
                {mfaData.totpSecretBase32}
              </div>
            </div>

            {/* Verification code input */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 text-center">
                Introduce el código de 6 dígitos para validar la sincronización
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-44 mx-auto block px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-center text-2xl font-mono tracking-widest text-white transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                type="submit"
                disabled={totpCode.trim().length !== 6}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Verificar y Ver Códigos
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 4: CÓDIGOS DE RECUPERACIÓN Y ACTIVACIÓN ── */}
        {step === 4 && mfaData && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white mb-1">
                Códigos de Recuperación de Un Solo Uso
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Si alguna vez pierdes acceso a tu aplicación autenticadora, podrás utilizar cualquiera de estos 8 códigos para acceder. Guárdalos en tu gestor de contraseñas o en un lugar seguro.
              </p>
            </div>

            {/* 8 Codes Grid */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
              {mfaData.recoveryCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs font-mono"
                >
                  <span className="text-zinc-500 font-sans text-[10px]">#{index + 1}</span>
                  <span className="text-amber-400 font-bold tracking-wider">{code}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyAllCodes}
                className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedCodes ? '¡Códigos Copiados!' : 'Copiar Todos'}
              </button>
              <button
                type="button"
                onClick={handleDownloadCodes}
                className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar TXT
              </button>
            </div>

            {/* Confirmation checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 cursor-pointer">
              <input
                type="checkbox"
                checked={recoveryConfirmed}
                onChange={(e) => setRecoveryConfirmed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 leading-relaxed">
                Confirmo que he copiado y guardado estos 8 códigos de recuperación en un lugar seguro y privado.
              </span>
            </label>

            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-xs text-zinc-400">
              <span className="text-rose-400 font-bold block mb-1">Aviso de Retiro Atómico:</span>
              Al presionar activar, las cuentas administrativas anteriores (<code className="text-zinc-300">superadmin@barberos.com</code> y <code className="text-zinc-300">admin@barberos.co</code>) quedarán desactivadas permanentemente.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                type="button"
                onClick={handleCompleteSetup}
                disabled={loading || !recoveryConfirmed}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activando y asegurando BarberOS...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Activar Identidad y Proteger BarberOS
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-zinc-600">
        BarberOS Security Core &bull; Autenticación Criptográfica Soberana
      </div>
    </div>
  )
}

