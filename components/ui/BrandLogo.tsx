'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { getPublicSettings, PublicPlatformSettings } from '@/lib/platform-config'

export interface BrandLogoProps {
  /** Logo personalizado del negocio (si existe, se usa en lugar del logo de plataforma) */
  customLogo?: string | null
  alt?: string
  width?: number
  height?: number
  className?: string
  imageClassName?: string
  priority?: boolean
  unoptimized?: boolean
  /** URL opcional para forzar logo claro */
  lightSrc?: string
  /** URL opcional para forzar logo oscuro */
  darkSrc?: string
}

/**
 * Componente oficial de Logo de BarberOS con soporte nativo para Tema Claro y Tema Oscuro.
 * Si se pasa `customLogo` (de una barbería), lo muestra directamente.
 * Si no, muestra el logo oficial de BarberOS adaptado automáticamente al tema (vía clases dark: de Tailwind).
 * Sincroniza dinámicamente con los logos configurados en Super Admin (PlatformSetting).
 */
export default function BrandLogo({
  customLogo,
  alt = 'BarberOS',
  width = 40,
  height = 40,
  className = '',
  imageClassName = 'w-full h-full object-cover',
  priority = false,
  unoptimized = false,
  lightSrc,
  darkSrc
}: BrandLogoProps) {
  const [dynamicLight, setDynamicLight] = useState<string>(lightSrc || '/logo-light.png')
  const [dynamicDark, setDynamicDark] = useState<string>(darkSrc || '/logo-dark.png')

  useEffect(() => {
    // Si ya se pasaron URLs fijas explícitas, respetarlas
    if (lightSrc && darkSrc) return

    let isMounted = true

    const loadPlatformLogos = async () => {
      try {
        const settings = await getPublicSettings()
        if (!isMounted) return
        if (!lightSrc && settings.platform_logo_light) {
          setDynamicLight(settings.platform_logo_light)
        }
        if (!darkSrc && (settings.platform_logo_dark || settings.platform_logo)) {
          setDynamicDark(settings.platform_logo_dark || settings.platform_logo)
        }
      } catch {
        // Fallback a archivos por defecto
      }
    }

    loadPlatformLogos()

    const handleUpdate = () => {
      loadPlatformLogos()
    }

    window.addEventListener('platform-settings-updated', handleUpdate)
    return () => {
      isMounted = false
      window.removeEventListener('platform-settings-updated', handleUpdate)
    }
  }, [lightSrc, darkSrc])

  if (customLogo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={customLogo}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          unoptimized={unoptimized || customLogo.startsWith('data:')}
          className={imageClassName}
        />
      </div>
    )
  }

  const finalLight = lightSrc || dynamicLight
  const finalDark = darkSrc || dynamicDark

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Logo Tema Claro: visible solo en modo claro */}
      <Image
        src={finalLight}
        alt={`${alt} (Claro)`}
        width={width}
        height={height}
        priority={priority}
        unoptimized={finalLight.startsWith('http')}
        className={`${imageClassName} dark:hidden block`}
      />
      {/* Logo Tema Oscuro: visible solo en modo oscuro */}
      <Image
        src={finalDark}
        alt={`${alt} (Oscuro)`}
        width={width}
        height={height}
        priority={priority}
        unoptimized={finalDark.startsWith('http')}
        className={`${imageClassName} hidden dark:block`}
      />
    </div>
  )
}
