import React from 'react'
import Image from 'next/image'

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
  lightSrc = '/logo-light.png',
  darkSrc = '/logo-dark.png'
}: BrandLogoProps) {
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

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Logo Tema Claro: visible solo en modo claro */}
      <Image
        src={lightSrc}
        alt={`${alt} (Claro)`}
        width={width}
        height={height}
        priority={priority}
        className={`${imageClassName} dark:hidden block`}
      />
      {/* Logo Tema Oscuro: visible solo en modo oscuro */}
      <Image
        src={darkSrc}
        alt={`${alt} (Oscuro)`}
        width={width}
        height={height}
        priority={priority}
        className={`${imageClassName} hidden dark:block`}
      />
    </div>
  )
}
