'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, KeyRound, Fingerprint, LifeBuoy, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { startAuthentication } from '@simplewebauthn/browser'

export default function MfaChallengePage() {
  const [activeTab, setActiveTab] = useState<'totp' | 'passkey' | 'recovery'>('totp')
  const [totpCode, setTotpCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpCode || totpCode.trim().length !== 6) {
      toast.error('Ingresa el código numérico de 6 dígitos')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'totp', code: totpCode.trim() })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Segundo factor verificado exitosamente')
        window.location.href = data.redirect || '/superadmin/dashboard'
      } else {
        toast.error(data.error || 'Código de seguridad inválido')
      }
    } catch {
      toast.error('Error de conexión al verificar segundo factor')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryCode.trim()) {
      toast.error('Ingresa un código de recuperación')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'recovery_code', code: recoveryCode.trim() })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Código de recuperación aceptado')
        window.location.href = data.redirect || '/superadmin/dashboard'
      } else {
        toast.error(data.error || 'Código de recuperación inválido o ya utilizado')
      }
    } catch {
      toast.error('Error de red al verificar código')
    } finally {
      setLoading(false)
    }
  }

  const handlePasskeyAuth = async () => {
    setLoading(true)
    try {
      // 1. Obtener opciones del servidor
      const optRes = await fetch('/api/auth/webauthn/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const options = await optRes.json()

      if (!optRes.ok) {
        toast.error(options.error || 'No se pudieron generar opciones de Passkey')
        setLoading(false)
        return
      }

      // 2. Ejecutar desafío biométrico / llave física en el navegador
      let assertion
      try {
        assertion = await startAuthentication({ optionsJSON: options })
      } catch (authErr: any) {
        if (authErr.name === 'NotAllowedError') {
          toast.error('Operación biométrica cancelada o expirada.')
        } else {
          toast.error('Fallo en el autenticador: ' + (authErr.message || 'Desconocido'))
        }
        setLoading(false)
        return
      }

      // 3. Enviar verificación al servidor
      const verifyRes = await fetch('/api/auth/webauthn/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assertion)
      })

      const verifyData = await verifyRes.json()
      if (verifyRes.ok && verifyData.success) {
        toast.success('Passkey verificada con éxito')
        window.location.href = verifyData.redirect || '/superadmin/dashboard'
      } else {
        toast.error(verifyData.error || 'Fallo de verificación de Passkey')
      }
    } catch (err: any) {
      toast.error('Error al autenticar con Passkey: ' + (err.message || 'Desconocido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl relative overflow-hidden"
      >
        {/* Glow de acento */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 dark:bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Segundo Factor Obligatorio
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              BarberOS Sentinel — Blindaje de Identidad
            </p>
          </div>
        </div>

        {/* TABS DE SELECCIÓN */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('totp')}
            className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'totp'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>TOTP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('passkey')}
            className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'passkey'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Passkey</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'recovery'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Respaldo</span>
          </button>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}
        <AnimatePresence mode="wait">
          {activeTab === 'totp' && (
            <motion.form
              key="totp-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleVerifyTotp}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Código de 6 Dígitos (Google / Microsoft Authenticator)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirmar y Acceder</span>}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </motion.form>
          )}

          {activeTab === 'passkey' && (
            <motion.div
              key="passkey-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 text-center py-2"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Fingerprint className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Identificación FIDO2 / Passkey
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Usa Windows Hello, Touch ID, Face ID o tu llave física USB/NFC para validar tu identidad de Propietario.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePasskeyAuth}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                <span>Activar Lector de Passkey</span>
              </button>
            </motion.div>
          )}

          {activeTab === 'recovery' && (
            <motion.form
              key="recovery-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleVerifyRecoveryCode}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Código de Emergencia de Un Solo Uso
                </label>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  className="w-full text-center font-mono py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  Este código quedará invalidado inmediatamente tras su uso.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !recoveryCode.trim()}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Acceder con Código de Respaldo</span>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Regresar al inicio de sesión</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

