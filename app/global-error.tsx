'use client'

import React, { useEffect } from 'react'
import ErrorLayout from '@/components/errors/ErrorLayout'
import { Graphic500 } from '@/components/errors/ErrorGraphics'
import { RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[BarberOS Global Root Error]:', error?.message || 'Fallo en layout raíz')
  }, [error])

  return (
    <html lang="es" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="bg-[#050608] text-white antialiased">
        <ErrorLayout
          code="500"
          badgeText="Fallo Crítico de Inicialización"
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
            { label: 'Soporte Técnico', href: '/support' },
          ]}
        />
      </body>
    </html>
  )
}
