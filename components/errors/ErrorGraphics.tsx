'use client'

import React from 'react'

/**
 * 404: Números metálicos tridimensionales flotantes
 */
export function Graphic404() {
  return (
    <div className="barberos-error-3d-wrap text-[6.5rem] sm:text-[9.5rem] md:text-[12rem] lg:text-[13.5rem] font-black leading-none tracking-[-0.06em]">
      <span className="barberos-metallic-extrusion" aria-hidden="true">
        404
      </span>
      <span className="barberos-metallic-face">
        404
      </span>
      <span className="barberos-floor-reflection" aria-hidden="true">
        404
      </span>
    </div>
  )
}

/**
 * 403: Escudo tridimensional metálico de seguridad con candado cincelado
 */
export function Graphic403() {
  return (
    <div className="barberos-error-3d-wrap w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center relative">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldChrome" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#CBD5E1" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="75%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="shieldExtrusion" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>
          <linearGradient id="amberLock" x1="70" y1="80" x2="130" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* Capa de extrusión / sombra 3D inferior */}
        <path
          d="M100 188C154 165 178 126 178 68V34L100 12L22 34V68C22 126 46 165 100 188Z"
          fill="url(#shieldExtrusion)"
          transform="translate(0, 10)"
          opacity="0.8"
        />

        {/* Cuerpo del escudo metálico biselado */}
        <path
          d="M100 180C150 158 172 121 172 65V32L100 10L28 32V65C28 121 50 158 100 180Z"
          fill="url(#shieldChrome)"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />

        {/* Bisel interno de contraste */}
        <path
          d="M100 166C140 146 158 113 158 63V39L100 22L42 39V63C42 113 60 146 100 166Z"
          fill="#0B0F19"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />

        {/* Candado de seguridad dorado/platino */}
        <rect x="74" y="94" width="52" height="42" rx="10" fill="url(#amberLock)" stroke="#FEF3C7" strokeWidth="1.5" />
        <path
          d="M84 94V78C84 69.16 91.16 62 100 62C108.84 62 116 69.16 116 78V94"
          stroke="url(#shieldChrome)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Ojo de cerradura */}
        <circle cx="100" cy="112" r="4.5" fill="#0B0F19" />
        <path d="M98 114L96 125H104L102 114" fill="#0B0F19" />
      </svg>

      {/* Reflejo difuso en el suelo */}
      <div className="barberos-floor-reflection w-full flex justify-center">
        <div className="w-32 h-16 bg-amber-500/20 rounded-full blur-xl" />
      </div>
    </div>
  )
}

/**
 * 500: Números 500 metálicos flotantes con engranaje arquitectónico desplazado
 */
export function Graphic500() {
  return (
    <div className="barberos-error-3d-wrap text-[6.5rem] sm:text-[9.5rem] md:text-[12rem] lg:text-[13.5rem] font-black leading-none tracking-[-0.06em]">
      <span className="barberos-metallic-extrusion" aria-hidden="true">
        500
      </span>
      <span className="barberos-metallic-face">
        500
      </span>
      <span className="barberos-floor-reflection" aria-hidden="true">
        500
      </span>
    </div>
  )
}

/**
 * 503: Monolito tridimensional de calibración y mantenimiento
 */
export function Graphic503() {
  return (
    <div className="barberos-error-3d-wrap w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center relative">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gearChrome" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#CBD5E1" />
            <stop offset="60%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="amberAccentGlow" x1="70" y1="70" x2="130" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Sombra de extrusión 3D */}
        <circle cx="100" cy="108" r="68" fill="#090D16" opacity="0.85" />

        {/* Engranaje maestro exterior con dientes de precisión */}
        <g stroke="url(#gearChrome)" strokeWidth="6" strokeLinecap="round">
          <line x1="100" y1="16" x2="100" y2="34" />
          <line x1="100" y1="166" x2="100" y2="184" />
          <line x1="16" y1="100" x2="34" y2="100" />
          <line x1="166" y1="100" x2="184" y2="100" />
          <line x1="40" y1="40" x2="54" y2="54" />
          <line x1="146" y1="146" x2="160" y2="160" />
          <line x1="160" y1="40" x2="146" y2="54" />
          <line x1="40" y1="160" x2="54" y2="146" />
        </g>

        {/* Aro exterior de titanio pulido */}
        <circle cx="100" cy="100" r="66" fill="url(#gearChrome)" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="50" fill="#0B0F19" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        {/* Llave inglesa / herramienta de calibración central */}
        <path
          d="M125 75L80 120C76 124 70 124 66 120L62 116C58 112 58 106 62 102L107 57C110 54 116 54 120 58L124 62C128 66 128 72 125 75Z"
          fill="url(#amberAccentGlow)"
          stroke="#FEF3C7"
          strokeWidth="1.5"
        />
        <circle cx="100" cy="100" r="12" fill="#0B0F19" stroke="url(#gearChrome)" strokeWidth="2" />
      </svg>

      {/* Reflejo difuso en el suelo */}
      <div className="barberos-floor-reflection w-full flex justify-center">
        <div className="w-32 h-16 bg-amber-500/20 rounded-full blur-xl" />
      </div>
    </div>
  )
}

/**
 * OFFLINE: Símbolo 3D de antena / conexión interrumpida con ondas metálicas
 */
export function GraphicOffline() {
  return (
    <div className="barberos-error-3d-wrap w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center relative">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wifiChrome" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#CBD5E1" />
            <stop offset="70%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="disconnectRed" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="50%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
        </defs>

        {/* Ondas superiores en arco metálico */}
        <path
          d="M36 68C72 36 128 36 164 68"
          stroke="url(#wifiChrome)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="4 8"
          opacity="0.4"
        />
        <path
          d="M58 92C81 71 119 71 142 92"
          stroke="url(#wifiChrome)"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M80 116C91 106 109 106 120 116"
          stroke="url(#wifiChrome)"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* Punto central de conexión con pulsación ámbar/rojo */}
        <circle cx="100" cy="144" r="10" fill="url(#disconnectRed)" stroke="#FEE2E2" strokeWidth="2" />

        {/* Barra diagonal de desconexión cromada */}
        <line
          x1="48"
          y1="48"
          x2="152"
          y2="152"
          stroke="url(#disconnectRed)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      {/* Reflejo difuso en el suelo */}
      <div className="barberos-floor-reflection w-full flex justify-center">
        <div className="w-32 h-16 bg-rose-500/20 rounded-full blur-xl" />
      </div>
    </div>
  )
}
