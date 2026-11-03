'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { Store, Save, Copy, ExternalLink, Upload, Trash2, Loader2, ImageIcon, Monitor, Palette, Sliders, MessageCircle, MapPin, Navigation, Info, CheckCircle2, AlertCircle } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { ConfirmImageDeleteModal } from '@/components/ui/ConfirmImageDeleteModal'
import AccentColorPicker from '@/components/ui/AccentColorPicker'
import { validateGoogleMapsUrl, parseLocation } from '@/lib/maps'
import { getBookingUrl } from '@/lib/url'

interface BusinessData {
  id: string
  name: string
  slug: string
  phone?: string | null
  address?: string | null
  mapsUrl?: string | null
  description?: string | null
  email?: string | null
  logo?: string | null
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance'>('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showDeleteLogoConfirm, setShowDeleteLogoConfirm] = useState(false)
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const fetchBusiness = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/owner/business')
      if (res.ok) {
        const data = await res.json()
        setBusiness(data)
      } else {
        toast.error('Error al cargar datos del negocio')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBusiness()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    // Validar enlace de Google Maps si se ingresó
    if (business.mapsUrl && business.mapsUrl.trim()) {
      const validation = validateGoogleMapsUrl(business.mapsUrl)
      if (!validation.isValid) {
        toast.error(validation.error || 'Por favor ingresa un enlace de Google Maps válido antes de guardar.')
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/owner/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business)
      })

      if (res.ok) {
        toast.success('Información del negocio actualizada con éxito ✨')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('business-updated'))
        }
      } else {
        toast.error('Error al actualizar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG, WEBP o SVG.')
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe pesar más de 5MB.')
      return
    }

    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/owner/business/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.logoUrl) {
        setBusiness((prev) => (prev ? { ...prev, logo: data.logoUrl } : null))
        toast.success('Foto actualizada correctamente.')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('business-updated'))
        }
      } else {
        toast.error(data.error || 'No se pudo actualizar la foto. Inténtalo de nuevo.')
      }
    } catch (error) {
      console.error(error)
      toast.error('No se pudo actualizar la foto. Inténtalo de nuevo.')
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = async () => {
    if (!business?.logo) return

    setUploadingLogo(true)
    try {
      const res = await fetch('/api/owner/business/logo', {
        method: 'DELETE',
      })

      if (res.ok) {
        setBusiness((prev) => (prev ? { ...prev, logo: null } : null))
        setShowDeleteLogoConfirm(false)
        toast.success('Foto eliminada correctamente.')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('business-updated'))
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'No se pudo eliminar la foto. Inténtalo de nuevo.')
      }
    } catch (error) {
      console.error(error)
      toast.error('No se pudo eliminar la foto. Inténtalo de nuevo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  const copyBookingLink = () => {
    if (!business) return
    const link = getBookingUrl(business.slug)
    navigator.clipboard.writeText(link)
    toast.success('Enlace de reserva copiado al portapapeles 🚀')
  }

  if (loading) {
    return <div className="p-12 text-center text-xs font-bold uppercase tracking-wider text-zinc-400">Cargando configuración del negocio...</div>
  }

  if (!business) return null

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0 relative border border-zinc-200">
            {business.logo ? (
              <Image
                src={business.logo}
                alt={business.name}
                fill
                sizes="64px"
                className="object-cover"
                priority
              />
            ) : (
              <Store size={26} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-950 uppercase tracking-tight">{business.name}</h2>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-0.5">slug: /{business.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyBookingLink}
            className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
          >
            <Copy size={14} /> Copiar Enlace
          </button>
          <a
            href={`/reserve/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black hover:bg-zinc-800 text-white p-2.5 rounded-2xl transition-all flex items-center justify-center"
            title="Ver página de reservas"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* ── TABS DE CONFIGURACIÓN ── */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'general'
              ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-md'
              : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Store size={14} /> Información General
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-md'
              : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Palette size={14} /> Apariencia
        </button>

        <Link
          href="/integrations"
          className="px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 text-zinc-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/10 ml-auto"
        >
          <MessageCircle size={14} className="text-emerald-500" /> Conexión WhatsApp & Meta
          <span className="text-[10px] bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">↗</span>
        </Link>
      </div>

      {/* ── TAB 1: INFORMACIÓN GENERAL ── */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-8 animate-fadeIn">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 dark:text-white">Información del Negocio</h3>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">Configura la identidad, imagen y datos de contacto de tu barbería.</p>
          </div>

          {/* Sección del Logo */}
          <div className="p-6 bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 text-white relative overflow-hidden flex items-center justify-center shrink-0 border-2 border-zinc-200 dark:border-zinc-700 shadow-md">
                {business.logo ? (
                  <Image
                    src={business.logo}
                    alt={business.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-500" />
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-tight">Logo Oficial</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                  Se mostrará en el menú del panel, página de reservas y comprobantes. Formatos recomendados: PNG o WEBP con fondo transparente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-black dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {uploadingLogo ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Subiendo...
                  </>
                ) : (
                  <>
                    <Upload size={14} /> {business.logo ? 'Cambiar Logo' : 'Subir Logo'}
                  </>
                )}
              </button>

              {business.logo && (
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => setShowDeleteLogoConfirm(true)}
                  className="p-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  title="Eliminar logo"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Formulario de Información General */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 mb-2">Nombre de la Barbería</label>
                <input
                  type="text"
                  required
                  value={business.name}
                  onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-950 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 mb-2">Teléfono Principal de Contacto</label>
                <input
                  type="text"
                  value={business.phone || ''}
                  onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                  placeholder="Ej. +57 300 123 4567"
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-950 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 mb-2">Dirección Física (Texto)</label>
                <input
                  type="text"
                  value={business.address || ''}
                  onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                  placeholder="Ej. Calle 85 # 14-20, Bogotá"
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-950 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all"
                />
                <p className="text-[10px] text-zinc-400 mt-1 font-medium">Dirección legible que verán tus clientes en el pie de página y confirmaciones.</p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 mb-2">Correo Electrónico del Negocio</label>
                <input
                  type="email"
                  value={business.email || ''}
                  onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                  placeholder="contacto@tuberberia.com"
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-950 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all"
                />
                <p className="text-[10px] text-zinc-400 mt-1 font-medium">Correo oficial de atención y soporte para tus clientes.</p>
              </div>
            </div>

            {/* Ubicación mediante Google Maps */}
            <div className="p-5 sm:p-6 bg-zinc-50 dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 dark:text-white">
                      Enlace de ubicación de Google Maps
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                      Permite que tus clientes vean el mapa interactivo y la ruta directa hacia tu barbería.
                    </p>
                  </div>
                </div>

                {business.mapsUrl && (
                  <div className="shrink-0">
                    {validateGoogleMapsUrl(business.mapsUrl).isValid ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 size={12} /> Válido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <AlertCircle size={12} /> No válido
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <input
                  type="url"
                  value={business.mapsUrl || ''}
                  onChange={(e) => setBusiness({ ...business, mapsUrl: e.target.value })}
                  placeholder="https://maps.app.goo.gl/... o https://www.google.com/maps/place/..."
                  className={`w-full p-3.5 bg-white dark:bg-zinc-950 border rounded-2xl text-xs font-mono text-zinc-950 dark:text-zinc-100 outline-none transition-all ${
                    business.mapsUrl && !validateGoogleMapsUrl(business.mapsUrl).isValid
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'
                  }`}
                />

                {business.mapsUrl && !validateGoogleMapsUrl(business.mapsUrl).isValid && (
                  <p className="mt-1.5 text-xs font-bold text-rose-500 flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{validateGoogleMapsUrl(business.mapsUrl).error}</span>
                  </p>
                )}
              </div>

              <div className="p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                <Info size={14} className="shrink-0 mt-0.5 text-amber-500" />
                <p className="text-[11px] leading-relaxed">
                  <strong>¿Cómo obtener tu enlace?</strong> Abre Google Maps en tu móvil o PC, busca el nombre o dirección exacta de tu barbería, haz clic en el botón <strong>Compartir</strong>, selecciona <strong>Copiar enlace</strong> y pégalo en este campo.
                </p>
              </div>

              {/* Vista previa del mapa interactivo si el enlace es válido */}
              {business.mapsUrl && validateGoogleMapsUrl(business.mapsUrl).isValid && (() => {
                const previewLocation = parseLocation(business.mapsUrl, business.name, business.address)
                return previewLocation ? (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        Vista previa en tu página pública:
                      </span>
                      <a
                        href={previewLocation.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-wider text-amber-500 hover:text-amber-400 flex items-center gap-1"
                      >
                        <Navigation size={11} /> Probar Cómo llegar ↗
                      </a>
                    </div>
                    {previewLocation.embedUrl ? (
                      <div className="w-full h-44 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 relative">
                        <iframe
                          src={previewLocation.embedUrl}
                          title="Vista previa de Google Maps"
                          className="w-full h-full border-0 pointer-events-auto"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-amber-500" />
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{business.address || business.name}</span>
                        </div>
                        <a
                          href={previewLocation.directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <Navigation size={12} /> Cómo llegar
                        </a>
                      </div>
                    )}
                  </div>
                ) : null
              })()}
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 mb-2">Descripción / Eslogan Público</label>
              <textarea
                rows={4}
                value={business.description || ''}
                onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                placeholder="Escribe una breve descripción de tu barbería que verán tus clientes en la página de reservas..."
                className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-950 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-black dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                <Save size={16} />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: APARIENCIA DEL SISTEMA ── */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 sm:p-8 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-amber-500 flex items-center justify-center shadow-sm shrink-0">
              <Monitor size={16} className="text-white dark:text-zinc-950" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-950 dark:text-zinc-100" style={{ letterSpacing: '-0.02em' }}>Apariencia del Sistema</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Elige cómo se ve BarberOS en tu dispositivo</p>
            </div>
          </div>
          <ThemeToggle variant="settings" />

          {/* ── Color de Acento ── */}
          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <AccentColorPicker />
          </div>
        </div>
      )}

      {/* ── BANNER ACCESO RÁPIDO A CONEXIÓN WHATSAPP ── */}
      <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <MessageCircle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-zinc-950 dark:text-white">Conexión WhatsApp & Meta API</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">La configuración de conexión y recordatorios automáticos ahora se encuentra en su propia sección del menú del sistema.</p>
          </div>
        </div>
        <Link
          href="/integrations"
          className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shrink-0 shadow-sm"
        >
          Ir a Conexión →
        </Link>
      </div>

      <ConfirmImageDeleteModal
        isOpen={showDeleteLogoConfirm}
        isDeleting={uploadingLogo}
        title="¿Eliminar logo oficial?"
        description="¿Estás seguro de que deseas eliminar esta foto? Esta acción no se puede deshacer."
        confirmText="Eliminar foto"
        cancelText="Cancelar"
        onClose={() => setShowDeleteLogoConfirm(false)}
        onConfirm={handleRemoveLogo}
      />
    </div>
  )
}
