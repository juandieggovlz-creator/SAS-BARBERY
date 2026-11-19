'use client'

import React from 'react'
import ErrorLayout from '@/components/errors/ErrorLayout'
import { Graphic503 } from '@/components/errors/ErrorGraphics'
import { RefreshCw, Home } from 'lucide-react'

export default function ServiceUnavailablePage() {
  return (
    <ErrorLayout
      code="503"
      badgeText="Ventana de Mantenimiento"
      badgeCategory="Estado"
      visualGraphic={<Graphic503 />}
      title="Estamos preparando todo para volver."
      description="BarberOS no está disponible temporalmente. Intenta acceder nuevamente en unos minutos."
      primaryAction={{
        label: 'Reintentar',
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
        },
        icon: RefreshCw,
      }}
      secondaryAction={{
        label: 'Volver al inicio',
        href: '/',
        icon: Home,
      }}
      quickLinks={[
        { label: 'Estado del Servicio', href: '/support' },
        { label: 'Soporte Técnico', href: '/support' },
      ]}
    />
  )
}
