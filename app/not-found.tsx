'use client'

import React from 'react'
import ErrorLayout from '@/components/errors/ErrorLayout'
import { Graphic404 } from '@/components/errors/ErrorGraphics'
import { ArrowLeft, LogIn } from 'lucide-react'

export default function NotFound() {
  return (
    <ErrorLayout
      code="404"
      badgeText="Turno fuera de agenda"
      badgeCategory="Error"
      visualGraphic={<Graphic404 />}
      title="Parece que esta página se salió de la agenda."
      description="La dirección que buscas no existe o ya no está disponible."
      primaryAction={{
        label: 'Volver al inicio',
        href: '/',
        icon: ArrowLeft,
      }}
      secondaryAction={{
        label: 'Iniciar sesión',
        href: '/login',
        icon: LogIn,
      }}
      quickLinks={[
        { label: 'Conoce BarberOS', href: '/#sistema' },
        { label: 'Soporte Técnico', href: '/support' },
      ]}
    />
  )
}
