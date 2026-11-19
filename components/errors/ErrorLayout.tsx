'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Scissors, ArrowLeft, ArrowRight, RefreshCw, Compass, HelpCircle } from 'lucide-react'

export interface ErrorAction {
  label: string
  href?: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'primary' | 'secondary'
}

export interface ErrorQuickLink {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface ErrorLayoutProps {
  code: string
  badgeText: string
  badgeCategory?: string
  visualGraphic: React.ReactNode
  title: string
  description: string
  primaryAction: ErrorAction
  secondaryAction?: ErrorAction
  quickLinks?: ErrorQuickLink[]
  showBrandHeader?: boolean
  showFooter?: boolean
  children?: React.ReactNode
}

export default function ErrorLayout({
  code,
  badgeText,
  badgeCategory = 'Error',
  visualGraphic,
  title,
  description,
  primaryAction,
  secondaryAction,
  quickLinks = [
    { label: 'Conoce BarberOS', href: '/#sistema', icon: Compass },
    { label: 'Soporte Técnico', href: '/support', icon: HelpCircle },
  ],
  showBrandHeader = true,
  showFooter = true,
  children,
}: ErrorLayoutProps) {
  return (
    <div className="relative min-h-screen w-full bg-[#050608] text-white flex flex-col justify-between overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* ══════════════════════════════════════════════════════════
          ILUMINACIÓN AMBIENTAL & TEXTURA METÁLICA DE FONDO
      ══════════════════════════════════════════════════════════ */}
      {/* Precision Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      {/* Atmospheric Dual Ambient Spotlights */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[480px] bg-gradient-to-b from-amber-500/10 via-amber-900/5 to-transparent rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-slate-400/8 via-zinc-200/5 to-slate-400/8 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Estilos CSS dedicados para extrusión metálica y reflejo */}
      <style>{`
        @keyframes errorFloat3D {
          0%, 100% {
            transform: perspective(1000px) rotateX(6deg) rotateY(-4deg) translateY(0px);
          }
          50% {
            transform: perspective(1000px) rotateX(8deg) rotateY(-6deg) translateY(-12px);
          }
        }
        @keyframes metallicGlint {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .barberos-error-3d-wrap {
          position: relative;
          display: inline-block;
          font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
          animation: errorFloat3D 7s ease-in-out infinite;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .barberos-metallic-face {
          position: relative;
          z-index: 2;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #f8fafc 18%,
            #cbd5e1 35%,
            #94a3b8 50%,
            #e2e8f0 65%,
            #ffffff 80%,
            #64748b 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 1px rgba(255, 255, 255, 0.45));
          animation: metallicGlint 9s linear infinite;
        }
        .barberos-metallic-extrusion {
          position: absolute;
          inset: 0;
          z-index: 1;
          color: #0f172a;
          text-shadow:
            0 1px 0 #cbd5e1,
            0 2px 0 #94a3b8,
            0 3px 0 #64748b,
            0 4px 0 #475569,
            0 5px 0 #334155,
            0 6px 0 #1e293b,
            0 7px 0 #0f172a,
            0 8px 0 #090d16,
            0 14px 28px rgba(0, 0, 0, 0.85),
            0 28px 56px rgba(0, 0, 0, 0.95);
          user-select: none;
          pointer-events: none;
        }
        .barberos-floor-reflection {
          position: absolute;
          top: 86%;
          left: 0;
          right: 0;
          transform: scaleY(-0.35);
          opacity: 0.18;
          filter: blur(4px);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 80%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 80%);
          pointer-events: none;
          user-select: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .barberos-error-3d-wrap {
            animation: none !important;
            transform: perspective(1000px) rotateX(4deg) !important;
          }
          .barberos-metallic-face {
            animation: none !important;
          }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          1. HEADER DE MARCA
      ══════════════════════════════════════════════════════════ */}
      {showBrandHeader && (
        <header className="relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-8 py-5 sm:py-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0 focus:outline-none"
            aria-label="BarberOS - Inicio"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden shadow-md shadow-black/50 transition-transform duration-200 group-hover:scale-105 border border-white/10 bg-black">
              <Image
                src="/logo.png"
                alt="BarberOS Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white leading-none">
                Barber<span className="font-light text-zinc-400">OS</span>
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase mt-0.5">
                Software de Élite
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all active:scale-[0.97]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Volver a</span> BarberOS
          </Link>
        </header>
      )}

      {/* ══════════════════════════════════════════════════════════
          2. ESCENARIO CENTRAL Y ELEMENTO 3D
      ══════════════════════════════════════════════════════════ */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-5 py-8 sm:py-12 md:py-16 flex flex-col items-center justify-center text-center">
        {/* Pill Badge Superior con Acento Dorado/Metálico */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold mb-6 sm:mb-8 shadow-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <span className="uppercase tracking-widest text-[11px] font-bold">{badgeCategory} {code}</span>
          <span className="text-zinc-600">|</span>
          <span className="tracking-tight text-xs font-medium text-zinc-300">{badgeText}</span>
        </motion.div>

        {/* Elemento 3D Metálico Personalizado */}
        <div className="relative my-2 sm:my-4 select-none">
          {visualGraphic}

          {/* Sombra de apoyo en el suelo (ambient occlusion disc) */}
          <div
            className="w-48 sm:w-72 md:w-96 h-6 mx-auto -mt-3 sm:-mt-5 bg-gradient-to-r from-transparent via-black/80 to-transparent rounded-full blur-md"
            aria-hidden="true"
          />
        </div>

        {/* Título y Descripción */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
          className="space-y-3.5 max-w-xl mx-auto mt-4 sm:mt-6"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-lg mx-auto font-normal">
            {description}
          </p>
        </motion.div>

        {/* Bloque de Acciones Táctiles */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 pt-7 sm:pt-8 w-full max-w-md sm:max-w-none"
        >
          {/* Botón Primario */}
          {primaryAction.href ? (
            <Link
              href={primaryAction.href}
              className="group min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 active:scale-[0.97] text-zinc-950 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all text-center cursor-pointer"
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              ) : (
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              )}
              <span>{primaryAction.label}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="group min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 active:scale-[0.97] text-zinc-950 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all text-center cursor-pointer"
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="w-4 h-4 transition-transform group-hover:rotate-180" />
              ) : (
                <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180" />
              )}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {/* Botón Secundario */}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="group min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full text-zinc-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 backdrop-blur-md active:scale-[0.97] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all text-center cursor-pointer"
              >
                {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition-colors" />}
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="group min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full text-zinc-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 backdrop-blur-md active:scale-[0.97] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all text-center cursor-pointer"
              >
                {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition-colors" />}
                <span>{secondaryAction.label}</span>
              </button>
            )
          )}
        </motion.div>

        {/* Contenido extra opcional (ej. formularios de reconexión) */}
        {children}

        {/* Sugerencias Rápidas */}
        {quickLinks && quickLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="pt-10 sm:pt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-400 font-medium"
          >
            <span className="text-zinc-500">¿Necesitas ayuda?</span>
            {quickLinks.map((item, idx) => (
              <React.Fragment key={item.href}>
                {idx > 0 && <span className="text-zinc-600 hidden sm:inline">·</span>}
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-amber-400 transition-colors"
                >
                  {item.icon && <item.icon className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{item.label}</span>
                </Link>
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════
          3. FOOTER SOBRIO
      ══════════════════════════════════════════════════════════ */}
      {showFooter && (
        <footer className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Scissors className="w-3 h-3 rotate-45" />
            </div>
            <span>© {new Date().getFullYear()} BarberOS. Plataforma integral para barberías.</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/privacidad" className="hover:text-zinc-300 transition-colors">
              Privacidad
            </Link>
            <span>·</span>
            <Link href="/terminos" className="hover:text-zinc-300 transition-colors">
              Términos
            </Link>
            <span>·</span>
            <Link href="/sla" className="hover:text-zinc-300 transition-colors">
              SLA
            </Link>
          </div>
        </footer>
      )}
    </div>
  )
}
