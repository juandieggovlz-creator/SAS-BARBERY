'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { DollarSign, ShieldAlert, Sparkles, CheckCircle2, Sliders, Calculator, Info, Loader2 } from 'lucide-react'

export default function DepositSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [depositEnabled, setDepositEnabled] = useState(false)
  const [depositType, setDepositType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE')
  const [depositPercentage, setDepositPercentage] = useState<number>(30)
  const [depositFixedAmount, setDepositFixedAmount] = useState<number>(15000)
  const [depositInstructions, setDepositInstructions] = useState<string>('')

  // Simulador de ejemplo
  const [sampleServicePrice, setSampleServicePrice] = useState<number>(45000)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/owner/settings/deposits')
      if (res.ok) {
        const data = await res.json()
        setDepositEnabled(Boolean(data.depositEnabled))
        setDepositType(data.depositType === 'FIXED' ? 'FIXED' : 'PERCENTAGE')
        setDepositPercentage(Number(data.depositPercentage) || 30)
        setDepositFixedAmount(Number(data.depositFixedAmount) || 15000)
        setDepositInstructions(data.depositInstructions || '')
      }
    } catch {
      toast.error('Error al cargar la configuración de anticipos')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/owner/settings/deposits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositEnabled,
          depositType,
          depositPercentage,
          depositFixedAmount,
          depositInstructions
        })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Configuración de anticipos guardada correctamente ✨')
      } else {
        toast.error(data.error || 'Error al guardar los cambios')
      }
    } catch {
      toast.error('Error de conexión al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Cálculos del simulador
  const calculateDeposit = (price: number) => {
    if (!depositEnabled) return { deposit: 0, balance: price }
    if (depositType === 'PERCENTAGE') {
      const deposit = Math.round((price * depositPercentage) / 100)
      const balance = Math.max(0, price - deposit)
      return { deposit, balance }
    } else {
      const deposit = Math.min(price, depositFixedAmount)
      const balance = Math.max(0, price - deposit)
      return { deposit, balance }
    }
  }

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  const preview = calculateDeposit(sampleServicePrice)

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-bold text-zinc-400 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
        <span>Cargando configuración de anticipos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header explicativo */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            <DollarSign className="w-3 h-3" />
            Compromiso de Reserva
          </span>
        </div>
        <h3 className="text-lg font-black text-zinc-950 dark:text-white uppercase tracking-tight">
          Anticipos y Señas de Reserva
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
          Reduce el ausentismo (no-shows) solicitando a tus clientes un abono previo para confirmar su cita. El sistema desglosa de forma transparente el valor a pagar ahora y el saldo restante en la barbería.
        </p>
      </div>

      {/* Switch Principal: Activar / Desactivar */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-4">
        <div>
          <label className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-tight block cursor-pointer">
            Exigir anticipo para agendar citas
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {depositEnabled
              ? 'Los clientes verán el requisito de anticipo y el desglose de pago al reservar.'
              : 'Las reservas se confirman sin requerir abono previo (comportamiento estándar).'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDepositEnabled(!depositEnabled)}
          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            depositEnabled ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-700'
          }`}
          role="switch"
          aria-checked={depositEnabled}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              depositEnabled ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Opciones cuando está activo */}
      {depositEnabled && (
        <div className="space-y-6 animate-fadeIn">
          {/* Tipo de Anticipo */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Modalidad de Cálculo</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDepositType('PERCENTAGE')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  depositType === 'PERCENTAGE'
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-zinc-950 dark:text-white ring-2 ring-amber-500/30'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-tight">Porcentaje del Servicio</span>
                  <span className="text-xs font-bold text-amber-500">%</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Calcula el abono proporcional al valor de cada servicio seleccionado.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDepositType('FIXED')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  depositType === 'FIXED'
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-zinc-950 dark:text-white ring-2 ring-amber-500/30'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-tight">Valor Fijo en COP</span>
                  <span className="text-xs font-bold text-amber-500">$ COP</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Un monto fijo idéntico para cualquier servicio que reserve el cliente.
                </p>
              </button>
            </div>

            {/* Configuración según el tipo seleccionado */}
            {depositType === 'PERCENTAGE' ? (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Porcentaje exigido: <strong className="text-amber-600 dark:text-amber-400 font-black text-sm">{depositPercentage}%</strong>
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Rango: 10% a 90%</span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="flex justify-between text-[10px] font-bold text-zinc-400 font-mono">
                  <span>10%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>90%</span>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Monto Fijo de Anticipo ($ COP)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">$</span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={depositFixedAmount}
                    onChange={(e) => setDepositFixedAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-black text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                    placeholder="15000"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Valor sugerido: $10.000 COP a $25.000 COP por cita.
                </p>
              </div>
            )}
          </div>

          {/* Instrucciones de Pago Manual */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Instrucciones para el Cliente</span>
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Indica al cliente cómo transferir su anticipo (Nequi, Daviplata, Bancolombia, Llave) y dónde remitir el comprobante.
            </p>
            <textarea
              rows={3}
              value={depositInstructions}
              onChange={(e) => setDepositInstructions(e.target.value)}
              placeholder="Ej: Transfiere el anticipo a Nequi / Daviplata al 300 123 4567 y envía el comprobante por WhatsApp para confirmar tu cupo."
              className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 resize-none font-medium"
            />
          </div>

          {/* CALCULADORA / SIMULADOR EN VIVO */}
          <div className="bg-zinc-950 dark:bg-[#121215] text-white p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Simulador de Reserva en Vivo
                </h4>
              </div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">
                Vista Previa Cliente
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-zinc-400 font-medium">Ejemplo precio servicio:</label>
              <input
                type="number"
                min="5000"
                step="5000"
                value={sampleServicePrice}
                onChange={(e) => setSampleServicePrice(Math.max(5000, Number(e.target.value)))}
                className="w-28 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-white outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Anticipo a Pagar al Reservar
                </div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {formatCOP(preview.deposit)}
                </div>
                <div className="text-[11px] text-amber-200/80 mt-0.5">
                  {depositType === 'PERCENTAGE' ? `${depositPercentage}% del total` : 'Monto fijo'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Saldo Restante al Llegar al Local
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {formatCOP(preview.balance)}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Liquidado al finalizar la atención
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón Guardar */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-zinc-950 dark:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Guardar Configuración de Anticipos</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
