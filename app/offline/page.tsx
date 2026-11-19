'use client'

import React, { useState } from 'react'
import ErrorLayout from '@/components/errors/ErrorLayout'
import { GraphicOffline } from '@/components/errors/ErrorGraphics'
import { Wifi, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function OfflinePage() {
  const [checking, setChecking] = useState(false)

  const handleRetry = async () => {
    setChecking(true)
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        toast.error('Tu dispositivo continúa sin conexión a internet.')
        setChecking(false)
        return
      }

      // Intentar una petición ligera para comprobar conectividad real
      const res = await fetch('/api/platform/settings', { cache: 'no-store' })
      if (res.ok) {
        toast.success('¡Conexión restablecida!')
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } else {
        toast.error('Conexión limitada. Intenta en unos instantes.')
      }
    } catch {
      toast.error('Aún no se puede establecer contacto con BarberOS.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <ErrorLayout
      code="OFFLINE"
      badgeText="Sin Red"
      badgeCategory="Conexión"
      visualGraphic={<GraphicOffline />}
      title="Se perdió la conexión."
      description="Comprueba tu conexión a internet para continuar utilizando BarberOS."
      primaryAction={{
        label: checking ? 'Verificando...' : 'Reintentar conexión',
        onClick: handleRetry,
        icon: Wifi,
      }}
      secondaryAction={{
        label: 'Volver a intentar cargar',
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
        },
        icon: RefreshCw,
      }}
      quickLinks={[
        { label: 'Ir a Inicio', href: '/' },
        { label: 'Soporte Técnico', href: '/support' },
      ]}
    />
  )
}
