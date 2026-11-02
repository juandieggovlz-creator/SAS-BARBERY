'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Save,
  Globe,
  Mail,
  Building2,
  Shield,
  Clock,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  KeyRound,
  FileCode,
  Send,
  Sparkles,
  Phone,
  CheckCircle2,
  Palette
} from 'lucide-react'
import { toast } from 'sonner'
import AccentColorPicker from '@/components/ui/AccentColorPicker'

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'businesses' | 'security' | 'emails'>('general')

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/settings')
      if (res.ok) {
        const json = await res.json()
        setSettings(json.settings || {})
      } else {
        toast.error('Error al cargar la configuración global')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (res.ok) {
        toast.success('Configuración global BarberOS guardada con éxito')
      } else {
        toast.error('Error al guardar ajustes')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <Settings className="w-3 h-3" />
              Parámetros Globales
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Configuración Global BarberOS
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Administra los parámetros de la plataforma: identidad, reglas de onboarding, políticas de seguridad y plantillas.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer shadow-xs w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restablecer</span>
        </button>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
        {[
          { key: 'general', label: '1. General', icon: Globe },
          { key: 'businesses', label: '2. Negocios', icon: Building2 },
          { key: 'security', label: '3. Seguridad', icon: Shield },
          { key: 'emails', label: '4. Plantillas de Correo', icon: Mail }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── FORM ── */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-zinc-200">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
          <span className="text-xs font-bold text-zinc-400">Cargando configuración global...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-6">
              <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-500" /> Identidad & Contacto de la Plataforma
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Define los datos oficiales que ven los propietarios y barberos en emails y soporte.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Módulo General</span>
              </div>

              {/* ── Color de Acento ── */}
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-white">Personalización de Panel</h4>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Color de acento personal para tu panel. El cambio aplica de inmediato.</p>
                <AccentColorPicker card={false} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Nombre de la Plataforma
                  </label>
                  <input
                    type="text"
                    value={settings.platform_name || 'BarberOS'}
                    onChange={e => handleChange('platform_name', e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-900 outline-none focus:border-zinc-950"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Nombre comercial visible en landing, emails y barra de título.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Logo Oficial (URL o path)
                  </label>
                  <input
                    type="text"
                    value={settings.platform_logo || '/logo.png'}
                    onChange={e => handleChange('platform_logo', e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-900 outline-none focus:border-zinc-950 font-mono"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Ubicación del isotipo corporativo.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Correo de Soporte Oficial
                  </label>
                  <input
                    type="email"
                    value={settings.support_email || 'soporte@barberos.co'}
                    onChange={e => handleChange('support_email', e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-900 outline-none focus:border-zinc-950"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Canal oficial de respuesta a incidencias técnicas.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    WhatsApp de Soporte
                  </label>
                  <input
                    type="text"
                    value={settings.support_whatsapp || '+57 324 2063393'}
                    onChange={e => handleChange('support_whatsapp', e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-900 outline-none focus:border-zinc-950 font-mono"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Línea directa para atención y cierre comercial rápido.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEGOCIOS */}
          {activeTab === 'businesses' && (
            <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-6">
              <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-500" /> Parámetros por Defecto para Negocios
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Configura las condiciones automáticas al registrar una nueva barbería en BarberOS.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Onboarding SaaS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Días de Prueba por Defecto
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={settings.trial_days || '14'}
                    onChange={e => handleChange('trial_days', e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-900 outline-none focus:border-zinc-950"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Número de días asignados al registrar una barbería desde el Wizard.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Plan por Defecto
                  </label>
                  <select
                    value={settings.default_plan || 'pro'}
                    onChange={e => handleChange('default_plan', e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-800 outline-none cursor-pointer"
                  >
                    <option value="pro">Plan Profesional (Recomendado)</option>
                    <option value="starter">Plan Básico / Inicial</option>
                    <option value="enterprise">Plan Cadenas / Enterprise</option>
                  </select>
                  <p className="text-[10px] text-zinc-400 mt-1">Plan comercial sugerido tras culminar el periodo de prueba.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SEGURIDAD */}
          {activeTab === 'security' && (
            <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-6">
              <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-500" /> Políticas de Seguridad & Sesión
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Reglas de expiración de tokens, protección de accesos y recuperación de contraseñas.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Seguridad SaaS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Tiempo de Sesión (Horas)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={settings.session_timeout_hours || '24'}
                    onChange={e => handleChange('session_timeout_hours', e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-900 outline-none focus:border-zinc-950"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Duración máxima del JWT antes de requerir nuevo inicio de sesión.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Recuperación de Contraseña
                  </label>
                  <select
                    value={settings.password_recovery_enabled || 'true'}
                    onChange={e => handleChange('password_recovery_enabled', e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-800 outline-none cursor-pointer"
                  >
                    <option value="true">Habilitado (Envío de enlace por correo)</option>
                    <option value="false">Deshabilitado (Solo Super Admin resetea)</option>
                  </select>
                  <p className="text-[10px] text-zinc-400 mt-1">Permite a dueños y barberos recuperar acceso autónomamente.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PLANTILLAS DE CORREO */}
          {activeTab === 'emails' && (
            <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-6">
              <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-500" /> Plantillas de Correo Transaccionales
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Mensajes enviados automáticamente en los 4 eventos clave del ciclo de vida del cliente.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Email Templates</span>
              </div>

              <div className="space-y-6">
                {/* 1. Bienvenida */}
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Plantilla: Bienvenida a BarberOS
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Trigger: Registro de barbería</span>
                  </div>
                  <textarea
                    rows={3}
                    value={settings.email_template_welcome || '¡Bienvenido a BarberOS, {business_name}! Tu cuenta ha sido creada exitosamente. Empieza configurando tus horarios y compartiendo tu enlace de reservas.'}
                    onChange={e => handleChange('email_template_welcome', e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 font-mono outline-none"
                  />
                </div>

                {/* 2. Recuperación */}
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-indigo-500" /> Plantilla: Recuperación de Contraseña
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Trigger: Olvidé mi contraseña</span>
                  </div>
                  <textarea
                    rows={3}
                    value={settings.email_template_recovery || 'Hola {user_name}, recibimos una solicitud para restablecer tu contraseña en BarberOS. Haz clic en el siguiente enlace seguro para crear una nueva clave: {reset_link}'}
                    onChange={e => handleChange('email_template_recovery', e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 font-mono outline-none"
                  />
                </div>

                {/* 3. Activación */}
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Plantilla: Activación de Plan
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Trigger: Pago de suscripción</span>
                  </div>
                  <textarea
                    rows={3}
                    value={settings.email_template_activation || '¡Excelente noticia! Tu plan {plan_name} en BarberOS ha sido activado con éxito hasta el {end_date}. Todas las funcionalidades avanzadas están a tu disposición.'}
                    onChange={e => handleChange('email_template_activation', e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 font-mono outline-none"
                  />
                </div>

                {/* 4. Vencimiento */}
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-rose-500" /> Plantilla: Vencimiento de Suscripción / Prueba
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Trigger: 2 días antes de expirar</span>
                  </div>
                  <textarea
                    rows={3}
                    value={settings.email_template_expiration || 'Atención: Tu plan en BarberOS vence el {end_date}. Evita la interrupción de tus reservas online renovando tu plan ahora mismo.'}
                    onChange={e => handleChange('email_template_expiration', e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Submit Bar */}
          <div className="p-4 bg-white border border-zinc-200 rounded-3xl shadow-xs flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Los cambios se aplican globalmente a toda la plataforma de forma inmediata.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-zinc-950/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-400" />}
              <span>Guardar Configuración Global</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
