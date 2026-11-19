'use client'

import React, { useState, useEffect } from 'react'
import ErrorLayout from '@/components/errors/ErrorLayout'
import { Graphic403 } from '@/components/errors/ErrorGraphics'
import { LayoutDashboard, Home, ArrowLeft } from 'lucide-react'

export default function ForbiddenPage() {
  const [panelHref, setPanelHref] = useState<string>('/dashboard')

  useEffect(() => {
    // Resolver dinámicamente el panel correcto según la sesión activa del usuario
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.user) {
          setPanelHref('/login')
          return
        }
        const role = data.user.role
        if (role === 'SUPER_ADMIN' || role === 'ROOT_PLATFORM_OWNER') {
          setPanelHref('/superadmin/dashboard')
        } else if (role === 'BARBER') {
          setPanelHref('/barber/dashboard')
        } else {
          setPanelHref('/dashboard')
        }
      })
      .catch(() => {
        setPanelHref('/dashboard')
      })
  }, [])

  return (
    <ErrorLayout
      code="403"
      badgeText="Acceso Restringido"
      badgeCategory="Seguridad"
      visualGraphic={<Graphic403 />}
      title="Esta área está fuera de tu alcance."
      description="No tienes los permisos necesarios para acceder a esta sección."
      primaryAction={{
        label: 'Volver a mi panel',
        href: panelHref,
        icon: LayoutDashboard,
      }}
      secondaryAction={{
        label: 'Ir al inicio',
        href: '/',
        icon: Home,
      }}
      quickLinks={[
        { label: 'Centro de Soporte', href: '/support' },
        { label: 'Seguridad y Privacidad', href: '/seguridad' },
      ]}
    />
  )
}
