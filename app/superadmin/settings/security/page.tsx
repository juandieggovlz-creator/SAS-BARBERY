'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Smartphone,
  Laptop,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Plus,
  Copy,
  ExternalLink,
  Lock,
  Loader2,
  LogOut,
  ShieldAlert,
  Clock,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { startRegistration } from '@simplewebauthn/browser'

interface SecurityOverview {
  user: {
    id: string
    email: string
    role: string
    isRootOwner: boolean
    mfaEnabled: boolean
    mfaConfirmedAt: string | null
    googleLinked: boolean
    phoneNumber: string | null
    phoneVerified: boolean
    availableRecoveryCodesCount: number
  }
  passkeys: Array<{
    id: string
    deviceName: string | null
    createdAt: string
    lastUsedAt: string | null
  }>
  sessions: Array<{
    id: string
    ipAddress: string | null
    deviceInfo: string | null
    createdAt: string
    lastActiveAt: string
    expiresAt: string
  }>
  currentSessionId: string | null
  recentSecurityLogs: Array<{
    id: string
    action: string
    createdAt: string
    details: any
  }>
}

export default function SecuritySettingsPage() {
  const [data, setData] = useState<SecurityOverview | null>(null)
  const [loading, setLoading] = useState(true)

  // Estados modal TOTP Setup
  const [showTotpModal, setShowTotpModal] = useState(false)
  const [totpSetupData, setTotpSetupData] = useState<{ qrCodeDataUrl: string; secretBase32: string } | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [totpLoading, setTotpLoading] = useState(false)

  // Modal Códigos de Recuperación generados
  const [generatedRecoveryCodes, setGeneratedRecoveryCodes] = useState<string[] | null>(null)

  // Estado Modal Passkey Setup
  const [passkeyLoading, setPasskeyLoading] = useState(false)

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/security/overview')
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        toast.error(json.error || 'Error al cargar configuración de seguridad')
      }
    } catch {
      toast.error('Error de red al consultar seguridad')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSecurityData()
  }, [])

  // Iniciar configuración de TOTP
  const handleStartTotpSetup = async () => {
    setTotpLoading(true)
    try {
      const res = await fetch('/api/superadmin/security/totp/setup', { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.success) {
        setTotpSetupData({
          qrCodeDataUrl: json.qrCodeDataUrl,
          secretBase32: json.secretBase32
        })
        setShowTotpModal(true)
      } else {
        toast.error(json.error || 'No se pudo iniciar configuración TOTP')
      }
    } catch {
      toast.error('Error de red al iniciar TOTP')
    } finally {
      setTotpLoading(false)
    }
  }

  // Confirmar primer código TOTP
  const handleConfirmTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifyCode || verifyCode.trim().length !== 6) {
      toast.error('Ingresa el código de 6 dígitos de tu aplicación')
      return
    }

    setTotpLoading(true)
    try {
      const res = await fetch('/api/superadmin/security/totp/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode.trim() })
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message)
        setShowTotpModal(false)
        setVerifyCode('')
        setGeneratedRecoveryCodes(json.recoveryCodes)
        fetchSecurityData()
      } else {
        toast.error(json.error || 'Código incorrecto')
      }
    } catch {
      toast.error('Error al confirmar TOTP')
    } finally {
      setTotpLoading(false)
    }
  }

  // Registrar nueva Passkey con WebAuthn
  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true)
    try {
      const optRes = await fetch('/api/superadmin/security/passkeys/register-options', { method: 'POST' })
      const options = await optRes.json()

      if (!optRes.ok) {
        toast.error(options.error || 'Error al obtener opciones WebAuthn')
        setPasskeyLoading(false)
        return
      }

      let attestation
      try {
        attestation = await startRegistration({ optionsJSON: options })
      } catch (authErr: any) {
        if (authErr.name === 'NotAllowedError') {
          toast.error('Registro biométrico cancelado.')
        } else {
          toast.error('Error en autenticador: ' + (authErr.message || 'Desconocido'))
        }
        setPasskeyLoading(false)
        return
      }

      const verifyRes = await fetch('/api/superadmin/security/passkeys/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationResponse: attestation })
      })

      const verifyJson = await verifyRes.json()
      if (verifyRes.ok && verifyJson.success) {
        toast.success('Passkey registrada exitosamente')
        fetchSecurityData()
      } else {
        toast.error(verifyJson.error || 'Fallo al verificar registro de Passkey')
      }
    } catch (err: any) {
      toast.error('Error al registrar Passkey: ' + (err.message || 'Desconocido'))
    } finally {
      setPasskeyLoading(false)
    }
  }

  // Revocar Passkey
  const handleRevokePasskey = async (id: string) => {
    if (!confirm('¿Estás seguro de revocar esta llave de acceso?')) return
    try {
      const res = await fetch(`/api/superadmin/security/passkeys/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message)
        fetchSecurityData()
      } else {
        toast.error(json.error || 'Error al revocar Passkey')
      }
    } catch {
      toast.error('Error de red')
    }
  }

  // Regenerar Códigos de Recuperación
  const handleRegenerateRecoveryCodes = async () => {
    if (!confirm('¿Deseas generar nuevos códigos de recuperación? Los anteriores quedarán invalidados inmediatamente.')) return
    try {
      const res = await fetch('/api/superadmin/security/recovery-codes/generate', { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.success) {
        setGeneratedRecoveryCodes(json.recoveryCodes)
        toast.success(json.message)
        fetchSecurityData()
      } else {
        toast.error(json.error || 'Error al regenerar códigos')
      }
    } catch {
      toast.error('Error de red')
    }
  }

  // Revocar sesión individual o todas las demás
  const handleRevokeSession = async (sessionId?: string, revokeAllOthers = false) => {
    try {
      const res = await fetch('/api/superadmin/security/sessions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, revokeAllOthers })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message)
        fetchSecurityData()
      } else {
        toast.error(json.error || 'Error al revocar sesión')
      }
    } catch {
      toast.error('Error de red al revocar sesión')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/superadmin/settings"
              className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Seguridad de la Cuenta & Identidad Raíz
                </h1>
                {data?.user.isRootOwner ? (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Root Platform Owner
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
                    Super Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Gestión de factores de autenticación (TOTP, Passkeys FIDO2), sesiones activas y códigos de respaldo.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchSecurityData}
          disabled={loading}
          className="self-start sm:self-center p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── MODAL MOSTRAR CÓDIGOS DE RECUPERACIÓN GENERADOS ── */}
      {generatedRecoveryCodes && (
        <div className="p-5 rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 dark:bg-amber-400/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>IMPORTANTE: Guarda estos 8 códigos de recuperación</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedRecoveryCodes.join('\n'))
                toast.success('Códigos copiados al portapapeles')
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Todos</span>
            </button>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            Cada código solo puede utilizarse una única vez si pierdes acceso a tu aplicación de autenticación o llave física. No se volverán a mostrar.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            {generatedRecoveryCodes.map((c, i) => (
              <div key={i} className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-amber-500/20 text-center font-bold text-slate-900 dark:text-white">
                {c}
              </div>
            ))}
          </div>
          <div className="text-right pt-2">
            <button
              onClick={() => setGeneratedRecoveryCodes(null)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 underline"
            >
              He guardado mis códigos de forma segura
            </button>
          </div>
        </div>
      )}

      {/* ── GRID DE FACTORES DE SEGURIDAD ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FACTOR 1: TOTP AUTHENTICATOR */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Autenticador TOTP (6 Dígitos)
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Google Authenticator, Microsoft Authenticator o 1Password
                </p>
              </div>
            </div>
            {data?.user.mfaEnabled ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Activo
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                Requerido
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-400">
            {data?.user.mfaEnabled
              ? `Configurado y verificado el ${new Date(data.user.mfaConfirmedAt!).toLocaleDateString('es-CO')}. Se exige en cada inicio de sesión.`
              : 'La autenticación multifactor es obligatoria para la administración raíz de la plataforma.'}
          </p>

          <div className="pt-2">
            <button
              onClick={handleStartTotpSetup}
              disabled={totpLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all disabled:opacity-50"
            >
              {totpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              <span>{data?.user.mfaEnabled ? 'Reconfigurar Autenticador' : 'Configurar Autenticador (Escanear QR)'}</span>
            </button>
          </div>
        </div>

        {/* FACTOR 2: WEBAUTHN / PASSKEYS & FIDO2 */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Passkeys & Llaves FIDO2
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Touch ID, Face ID, Windows Hello y llaves de seguridad USB/NFC
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
              {data?.passkeys.length ?? 0} Registradas
            </span>
          </div>

          {data && data.passkeys.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
              {data.passkeys.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{p.deviceName || 'Llave FIDO2'}</span>
                    <span className="text-[10px] text-slate-400 block">
                      Registrada: {new Date(p.createdAt).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRevokePasskey(p.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded transition-all"
                    title="Revocar Passkey"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              No tienes passkeys registradas. Añade una para iniciar sesión con tu huella o reconocimiento facial sin escribir códigos.
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={handleRegisterPasskey}
              disabled={passkeyLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all disabled:opacity-50"
            >
              {passkeyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Añadir Nueva Passkey</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CÓDIGOS DE RESPALDO Y TELÉFONO ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Códigos de Recuperación de Emergencia
            </h3>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
              {data?.user.availableRecoveryCodesCount ?? 0} disponibles
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Códigos criptográficos de un solo uso para recuperar el acceso a la cuenta en caso de pérdida total de tu autenticador.
          </p>
          <div className="pt-2">
            <button
              onClick={handleRegenerateRecoveryCodes}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-slate-800 dark:text-zinc-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerar Códigos de Respaldo</span>
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              Teléfono para Alertas y Recuperación Secundaria
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data?.user.phoneVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {data?.user.phoneVerified ? 'Verificado' : 'No verificado'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {data?.user.phoneNumber ? `Número registrado: ${data.user.phoneNumber}` : 'Ningún número telefónico vinculado.'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            Nota: Este canal es complementario para avisos de seguridad críticos, no reemplaza el MFA obligatorio.
          </p>
        </div>
      </div>

      {/* ── SESIONES ACTIVAS PERSISTENTES ── */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-sky-500" />
              Dispositivos y Sesiones Persistentes Activas
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Registradas en PostgreSQL. La revocación de una sesión invalida su token en tiempo real.
            </p>
          </div>

          {data && data.sessions.length > 1 && (
            <button
              onClick={() => handleRevokeSession(undefined, true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Todas las Demás Sesiones</span>
            </button>
          )}
        </div>

        {data && data.sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Dispositivo</th>
                  <th className="py-2.5 px-3">Dirección IP</th>
                  <th className="py-2.5 px-3">Inicio de Sesión</th>
                  <th className="py-2.5 px-3">Última Actividad</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-mono">
                {data.sessions.map((s) => {
                  const isCurrent = s.id === data.currentSessionId
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-zinc-200">
                        <div className="flex items-center gap-2">
                          <span>{s.deviceInfo || 'Navegador Web'}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              ESTE DISPOSITIVO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{s.ipAddress || 'Desconocida'}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans">
                        {new Date(s.createdAt).toLocaleString('es-CO')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans">
                        {new Date(s.lastActiveAt).toLocaleString('es-CO')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            className="text-red-500 hover:text-red-700 font-sans text-xs underline"
                          >
                            Cerrar Sesión
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-4 text-center text-slate-400 text-xs">
            No hay otras sesiones activas registradas.
          </div>
        )}
      </div>

      {/* ── MODAL ESCANEAR QR TOTP ── */}
      {showTotpModal && totpSetupData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Configurar Autenticador TOTP
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Escanea este código QR con Google Authenticator, Microsoft Authenticator o tu gestor de contraseñas.
            </p>

            <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200 dark:border-zinc-800">
              <img
                src={totpSetupData.qrCodeDataUrl}
                alt="QR Code TOTP"
                className="w-48 h-48 rounded-lg"
              />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Clave de Configuración Manual (Secreto Base32):
              </span>
              <code className="block p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-mono text-center text-slate-800 dark:text-zinc-200 select-all">
                {totpSetupData.secretBase32}
              </code>
            </div>

            <form onSubmit={handleConfirmTotp} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Ingresa el código de 6 dígitos que muestra tu aplicación:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-xl font-mono py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTotpModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={totpLoading || verifyCode.length !== 6}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-50"
                >
                  {totpLoading ? 'Verificando...' : 'Confirmar y Activar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

