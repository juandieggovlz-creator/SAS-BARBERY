'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Bell,
  Volume2,
  VolumeX,
  Smartphone,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Share,
  PlusSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
  playChimeSound,
} from '@/lib/push-client'

interface DeviceRecord {
  id: string
  deviceName: string
  userAgent: string
  createdAt: string
  updatedAt: string
}

interface NotificationPreferences {
  pushEnabled: boolean
  soundEnabled: boolean
  notifyNewAppointment: boolean
  notifyCancelled: boolean
  notifyRescheduled: boolean
  notifyStatusChange: boolean
}

export default function NotificationSettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [pushStatus, setPushStatus] = useState<{
    supported: boolean
    permission: NotificationPermission
    isSubscribed: boolean
    isIOS: boolean
    isStandalone: boolean
  }>({
    supported: true,
    permission: 'default',
    isSubscribed: false,
    isIOS: false,
    isStandalone: false,
  })

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: true,
    soundEnabled: true,
    notifyNewAppointment: true,
    notifyCancelled: true,
    notifyRescheduled: true,
    notifyStatusChange: true,
  })

  const [devices, setDevices] = useState<DeviceRecord[]>([])
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [soundLocal, setSoundLocal] = useState(true)

  // Load status and preferences
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const loadAll = async () => {
      setLoading(true)
      try {
        // 1. Web Push status
        const status = await getPushStatus()
        if (!isMounted) return
        setPushStatus(status)

        // 2. Sound local storage
        const storedSound = localStorage.getItem('barberos_sound_enabled')
        const isSoundOn = storedSound !== 'false'
        setSoundLocal(isSoundOn)

        // 3. Server preferences
        const prefRes = await fetch('/api/push/preferences')
        if (prefRes.ok) {
          const prefData = await prefRes.json()
          if (prefData.preferences) {
            setPreferences(prefData.preferences)
          }
        }

        // 4. Registered devices
        const devRes = await fetch('/api/push/devices')
        if (devRes.ok) {
          const devData = await devRes.json()
          if (devData.devices) {
            setDevices(devData.devices)
          }
        }
      } catch (err) {
        console.warn('Error loading notification settings:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadAll()
    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Toggle push notifications on this device
  const handleTogglePush = async () => {
    setIsSubscribing(true)
    try {
      if (pushStatus.isSubscribed) {
        const res = await unsubscribeFromPush()
        if (res.success) {
          setPushStatus((prev) => ({ ...prev, isSubscribed: false }))
          toast.success('Notificaciones push desactivadas en este dispositivo.')
          // Refresh devices
          const devRes = await fetch('/api/push/devices')
          if (devRes.ok) {
            const devData = await devRes.json()
            setDevices(devData.devices || [])
          }
        } else {
          toast.error(res.error || 'Error al desactivar notificaciones.')
        }
      } else {
        const res = await subscribeToPush()
        if (res.success) {
          setPushStatus((prev) => ({ ...prev, isSubscribed: true, permission: 'granted' }))
          toast.success('¡Dispositivo suscrito exitosamente a notificaciones Web Push!')
          // Refresh devices
          const devRes = await fetch('/api/push/devices')
          if (devRes.ok) {
            const devData = await devRes.json()
            setDevices(devData.devices || [])
          }
        } else {
          toast.error(res.error || 'No se pudo activar las notificaciones.')
        }
      }
    } finally {
      setIsSubscribing(false)
    }
  }

  // Toggle internal sound chime
  const handleToggleSound = async () => {
    const nextState = !soundLocal
    setSoundLocal(nextState)
    localStorage.setItem('barberos_sound_enabled', nextState ? 'true' : 'false')
    if (nextState) {
      playChimeSound(true)
    }
    // Sync with server preferences
    try {
      await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soundEnabled: nextState }),
      })
    } catch {}
  }

  // Update specific event preference
  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const nextVal = !preferences[key]
    const updated = { ...preferences, [key]: nextVal }
    setPreferences(updated)

    try {
      await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: nextVal }),
      })
      toast.success('Preferencia guardada.')
    } catch {
      toast.error('Error al guardar preferencia.')
    }
  }

  // Delete a registered device
  const handleDeleteDevice = async (id: string) => {
    try {
      const res = await fetch(`/api/push/devices/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDevices((prev) => prev.filter((d) => d.id !== id))
        toast.success('Dispositivo eliminado.')
        // If current device might have been deleted, re-check
        const status = await getPushStatus()
        setPushStatus(status)
      } else {
        toast.error('Error al eliminar dispositivo.')
      }
    } catch {
      toast.error('Error de conexión.')
    }
  }

  // Send test notification
  const handleSendTest = async () => {
    setIsTesting(true)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        if (soundLocal) playChimeSound(true)
        toast.success('¡Notificación de prueba enviada a tus dispositivos registrados!')
      } else {
        toast.error(data.error || 'Error al enviar prueba.')
      }
    } catch {
      toast.error('Error al conectar con el servidor.')
    } finally {
      setIsTesting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Configuración de Notificaciones</h2>
              <p className="text-xs text-zinc-400">Alertas en tiempo real, sonido y dispositivos vinculados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span>Cargando configuración...</span>
            </div>
          ) : (
            <>
              {/* iOS Banner if detected and not standalone */}
              {pushStatus.isIOS && !pushStatus.isStandalone && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-zinc-900 border border-blue-500/30 text-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                      <Share className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs text-blue-100 flex items-center gap-1.5">
                        <span>Requisito en iPhone / iPad (iOS)</span>
                      </p>
                      <p className="text-xs text-blue-200/80 leading-relaxed">
                        Apple requiere instalar la web como App para recibir notificaciones cuando la pantalla esté bloqueada:
                      </p>
                      <ol className="text-xs list-decimal list-inside space-y-0.5 text-blue-200/90 font-medium pt-1">
                        <li>Toca el botón <strong>Compartir</strong> en Safari (<Share className="inline w-3 h-3" />).</li>
                        <li>Selecciona <strong>Añadir a pantalla de inicio</strong> (<PlusSquare className="inline w-3 h-3" />).</li>
                        <li>Abre BarberOS desde tu inicio y activa las notificaciones aquí.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* 1. Push Toggle for Current Device */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-zinc-200">Notificaciones Push en este equipo</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Recibe avisos incluso con la pestaña o el navegador cerrados.
                    </p>
                  </div>
                  <button
                    onClick={handleTogglePush}
                    disabled={isSubscribing || !pushStatus.supported}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                      pushStatus.isSubscribed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                    } disabled:opacity-50`}
                  >
                    {isSubscribing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : pushStatus.isSubscribed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Activo</span>
                      </>
                    ) : (
                      <span>Activar en este equipo</span>
                    )}
                  </button>
                </div>
                {!pushStatus.supported && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Este navegador no soporta el estándar Web Push Notification.
                  </p>
                )}
              </div>

              {/* 2. Internal Sound Chime */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {soundLocal ? (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-zinc-500" />
                      )}
                      <span className="font-semibold text-zinc-200">Sonido de Campanada Interna</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Sonido profesional cuando recibes citas mientras la app está abierta.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playChimeSound(true)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="Probar sonido"
                    >
                      Probar
                    </button>
                    <button
                      onClick={handleToggleSound}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        soundLocal ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          soundLocal ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Event Types Toggles */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <span className="font-semibold text-zinc-200 block text-xs tracking-wide uppercase text-zinc-400">
                  Tipos de Eventos a Notificar
                </span>
                <div className="space-y-2.5 pt-1">
                  {[
                    { key: 'notifyNewAppointment', label: 'Nuevas Reservas Agendadas' },
                    { key: 'notifyCancelled', label: 'Cancelaciones de Citas' },
                    { key: 'notifyRescheduled', label: 'Citas Reprogramadas' },
                    { key: 'notifyStatusChange', label: 'Cambios de Estado (Confirmadas / Completadas)' },
                  ].map(({ key, label }) => {
                    const active = preferences[key as keyof NotificationPreferences]
                    return (
                      <label
                        key={key}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/40 cursor-pointer transition-colors"
                      >
                        <span className="text-xs text-zinc-300">{label}</span>
                        <input
                          type="checkbox"
                          checked={active !== false}
                          onChange={() => handleTogglePref(key as keyof NotificationPreferences)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20 bg-zinc-800 border-zinc-700"
                        />
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* 4. Registered Devices */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 block text-xs tracking-wide uppercase text-zinc-400">
                    Dispositivos Vinculados ({devices.length})
                  </span>
                  <button
                    onClick={handleSendTest}
                    disabled={isTesting || devices.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors disabled:opacity-40"
                  >
                    {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    <span>Probar Alerta</span>
                  </button>
                </div>

                {devices.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-2">
                    Aún no tienes dispositivos registrados. Activa el botón de arriba en tu teléfono o PC para vincular este equipo.
                  </p>
                ) : (
                  <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                    {devices.map((dev) => (
                      <div
                        key={dev.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs"
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <p className="font-semibold text-zinc-200 truncate">{dev.deviceName}</p>
                          <p className="text-[10px] text-zinc-500">
                            Activo desde: {new Date(dev.createdAt).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteDevice(dev.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                          title="Desvincular dispositivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
