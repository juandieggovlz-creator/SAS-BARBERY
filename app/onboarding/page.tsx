'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Scissors,
  Building2,
  MapPin,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Copy,
  LogOut,
  Phone,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import LocationSelector from '@/components/ui/LocationSelector'
import { DEFAULT_SCHEDULE, DayScheduleItem } from '@/lib/schedule'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  // User info from Google
  const [userInfo, setUserInfo] = useState<{
    name: string
    email: string
    avatar: string | null
    businessName: string
  }>({
    name: 'Propietario',
    email: '',
    avatar: null,
    businessName: '',
  })

  // Form State
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')

  // Barbers
  const [barbers, setBarbers] = useState<string[]>([])
  const [newBarberName, setNewBarberName] = useState('')

  // Schedules
  const [schedule, setSchedule] = useState<DayScheduleItem[]>(DEFAULT_SCHEDULE)

  // Step tracker
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  useEffect(() => {
    async function loadInfo() {
      try {
        const res = await fetch('/api/onboarding/info')
        if (res.ok) {
          const data = await res.json()
          setUserInfo(data)
          if (data.businessName) {
            setBusinessName(data.businessName)
          } else if (data.name) {
            setBusinessName(`Barbería ${data.name}`)
          }
          // Default first barber could be the owner
          if (data.name) {
            setBarbers([data.name])
          }
        }
      } catch (err) {
        console.error('Error cargando info de onboarding:', err)
      } finally {
        setInitLoading(false)
      }
    }
    loadInfo()
  }, [])

  // Barbers management
  const handleAddBarber = () => {
    const trimmed = newBarberName.trim()
    if (!trimmed) return
    if (barbers.includes(trimmed)) {
      toast.error('Este barbero ya está en la lista')
      return
    }
    setBarbers([...barbers, trimmed])
    setNewBarberName('')
  }

  const handleRemoveBarber = (indexToRemove: number) => {
    setBarbers(barbers.filter((_, idx) => idx !== indexToRemove))
  }

  // Copy schedule from Monday to all days
  const handleCopyScheduleToAll = () => {
    const monday = schedule.find((s) => s.dayIndex === 1) || schedule[0]
    setSchedule((prev) =>
      prev.map((item) => ({
        ...item,
        openTime: monday.openTime,
        closeTime: monday.closeTime,
        isOpen: item.dayIndex === 0 ? item.isOpen : true,
      }))
    )
    toast.success(`Horario (${monday.openTime} - ${monday.closeTime}) copiado a toda la semana`)
  }

  // Next validations
  const handleNext = () => {
    if (step === 1) {
      if (!businessName.trim()) {
        toast.error('Por favor escribe el nombre de tu barbería')
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      if (!department.trim()) {
        toast.error('Selecciona el departamento de tu barbería')
        return
      }
      if (!city.trim()) {
        toast.error('Selecciona la ciudad o municipio')
        return
      }
      setStep(3)
      return
    }

    if (step === 3) {
      setStep(4)
      return
    }

    if (step === 4) {
      handleSubmitFinal()
    }
  }

  // Submit and activate 30-day trial
  const handleSubmitFinal = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          department,
          city,
          address,
          phone,
          barbers,
          schedule,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Error al completar la configuración.')
        return
      }

      toast.success('¡Configuración completada con éxito! Mes de prueba activado.')
      window.location.href = data.redirectUrl || '/dashboard'
    } catch {
      toast.error('Error de conexión con el servidor. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-400">Preparando tu espacio de trabajo...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col justify-between selection:bg-amber-400 selection:text-zinc-950">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-black shadow-md">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="text-xl font-black tracking-tight uppercase">
              Barber<span className="font-light text-zinc-500">OS</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {userInfo.avatar ? (
              <img
                src={userInfo.avatar}
                alt={userInfo.name}
                className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                {userInfo.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold text-zinc-200">{userInfo.name}</p>
              <p className="text-[11px] text-zinc-500 truncate max-w-[150px]">{userInfo.email}</p>
            </div>

            <button
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
                  window.location.href = '/login'
                })
              }}
              title="Cerrar sesión"
              className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors ml-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {/* Step Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {[
              { num: 1, label: 'Negocio' },
              { num: 2, label: 'Ubicación' },
              { num: 3, label: 'Equipo' },
              { num: 4, label: 'Horarios' },
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step > s.num
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : step === s.num
                      ? 'bg-white text-zinc-950 ring-4 ring-white/10 shadow-sm'
                      : 'bg-zinc-850 text-zinc-500 border border-zinc-700'
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                </div>
                <span
                  className={`text-[10px] font-bold mt-1.5 ${
                    step === s.num ? 'text-white' : 'text-zinc-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: '25%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {/* ── PASO 1: NOMBRE DEL NEGOCIO ──────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider text-amber-400">
                    <Sparkles className="w-3 h-3" />
                    <span>Bienvenido a BarberOS · Paso 1 de 4</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    ¿Cómo se llama tu barbería?
                  </h1>
                  <p className="text-sm text-zinc-400">
                    Este nombre será visible para tus clientes en tu página web de reservas y comprobantes.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Nombre de la Barbería *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Ej. Barbería Clásica Elite"
                        className="w-full pl-10 pr-4 py-3.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Teléfono o WhatsApp de contacto (opcional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+57 300 123 4567"
                        className="w-full pl-10 pr-4 py-3.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── PASO 2: UBICACIÓN CON AUTOCOMPLETADO INTELIGENTE ─────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-wider text-blue-400">
                    <MapPin className="w-3 h-3" />
                    <span>Ubicación · Paso 2 de 4</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    ¿Dónde está ubicada tu barbería?
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Filtra o escribe directamente tu departamento y ciudad para que tus clientes locales te encuentren fácil.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Selector Inteligente de Departamento y Ciudad */}
                  <LocationSelector
                    department={department}
                    city={city}
                    onDepartmentChange={(dept) => setDepartment(dept)}
                    onCityChange={(c) => setCity(c)}
                    isDark={true}
                    required={true}
                  />

                  {/* Dirección exacta (opcional) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Dirección física o sede (opcional)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej. Calle 85 # 14-20, Barrio El Poblado"
                        className="w-full pl-10 pr-4 py-3.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── PASO 3: EQUIPO / BARBEROS INICIALES ─────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-wider text-purple-400">
                    <Users className="w-3 h-3" />
                    <span>Equipo · Paso 3 de 4</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    ¿Quiénes atienden en la barbería?
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Agrega los nombres de tus barberos para organizar turnos y reservas. Podrás invitar más desde el dashboard en cualquier momento.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBarberName}
                      onChange={(e) => setNewBarberName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddBarber()
                        }
                      }}
                      placeholder="Nombre del barbero (ej. Mateo Gómez)"
                      className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddBarber}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar</span>
                    </button>
                  </div>

                  {/* Lista de barberos añadidos */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {barbers.map((bName, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center">
                            {bName.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-zinc-200">{bName}</span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                              Tú
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveBarber(idx)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {barbers.length === 0 && (
                      <p className="text-xs text-zinc-500 italic py-2">
                        No has agregado barberos aún. Puedes continuar y agregarlos más tarde.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── PASO 4: HORARIOS BASE & ACTIVACIÓN ───────────────────────── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    <Clock className="w-3 h-3" />
                    <span>Horarios · Paso 4 de 4</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Horarios de atención base
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Configura la jornada de trabajo estándar de tu barbería.
                  </p>
                </div>

                {/* Banner 30 días gratis */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-500/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Mes Completo Gratis Activado (30 días)
                    </h4>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Tendrás acceso ilimitado a todas las funciones profesionales de BarberOS sin restricciones.
                    </p>
                  </div>
                </div>

                {/* Resumen de días con botón rápido */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Jornada por Días
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyScheduleToAll}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar horario a la semana</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {schedule.map((item, idx) => (
                      <div
                        key={item.dayIndex}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                          item.isOpen
                            ? 'bg-zinc-800/80 border-zinc-700/80'
                            : 'bg-zinc-900 border-zinc-800 opacity-60'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isOpen}
                            onChange={(e) => {
                              const updated = [...schedule]
                              updated[idx].isOpen = e.target.checked
                              setSchedule(updated)
                            }}
                            className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-0"
                          />
                          <span className="text-xs font-bold text-zinc-200 w-20">{item.day}</span>
                        </label>

                        {item.isOpen ? (
                          <div className="flex items-center gap-2 text-xs">
                            <input
                              type="time"
                              value={item.openTime}
                              onChange={(e) => {
                                const updated = [...schedule]
                                updated[idx].openTime = e.target.value
                                setSchedule(updated)
                              }}
                              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white text-xs"
                            />
                            <span className="text-zinc-500">a</span>
                            <input
                              type="time"
                              value={item.closeTime}
                              onChange={(e) => {
                                const updated = [...schedule]
                                updated[idx].closeTime = e.target.value
                                setSchedule(updated)
                              }}
                              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white text-xs"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500 font-medium">Cerrado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={loading}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitFinal}
                    disabled={loading}
                    className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg shadow-amber-400/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        <span>Activando tu barbería...</span>
                      </>
                    ) : (
                      <>
                        <span>Finalizar y Activar mi Mes Gratis</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-600 border-t border-zinc-900">
        <p>BarberOS Cloud Platform · Tu barbería lista en segundos.</p>
      </footer>
    </div>
  )
}
