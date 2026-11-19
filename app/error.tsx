'use client'

import React, { useEffect } from 'react'
import ErrorLayout from '@/components/errors/ErrorLayout'
import { Graphic500 } from '@/components/errors/ErrorGraphics'
import { RefreshCw, Home } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Registro técnico seguro en consola del cliente (sin filtrar secretos ni stack traces a la UI)
    console.error('[BarberOS Error Boundary]:', error?.message || 'Error de ejecución no controlado')
  }, [error])

  return (
    <ErrorLayout
      code="500"
      badgeText="Interrupción Técnica"
      badgeCategory="Sistema"
      visualGraphic={<Graphic500 />}
      title="Algo no salió como esperábamos."
      description="Ocurrió un problema inesperado. Puedes intentarlo nuevamente en unos momentos."
      primaryAction={{
        label: 'Reintentar',
        onClick: () => reset(),
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
