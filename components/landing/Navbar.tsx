'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Menu, X, ChevronRight } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

const navLinks = [
  { label: 'Características', href: '#caracteristicas' },
  { label: 'Plataforma', href: '#sistema' },
  { label: 'Página Web', href: '#pagina-web' },
  { label: 'Cómo Funciona', href: '#como-funciona' },
  { label: 'Precios', href: '#precios' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          scrolled
            ? 'py-3 bg-white/90 dark:bg-[#050608]/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-white/10 shadow-sm'
            : 'py-4 bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0" aria-label="BarberOS - Inicio">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-zinc-950/10 dark:shadow-black/40"
              >
                <Image
                  src="/logo.png"
                  alt="BarberOS Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  priority
                />
              </motion.div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                  Barber<span className="font-light text-zinc-500 dark:text-zinc-400">OS</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links — Liquid Glass Dock */}
            <nav className="liquid-glass hidden lg:flex items-center gap-1 px-4 py-1.5 rounded-full" role="navigation" aria-label="Navegación principal">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all duration-150"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <ThemeToggle variant="navbar" />

              <Link
                href="/login"
                className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white px-4 py-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all duration-150"
              >
                Iniciar Sesión
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-zinc-950 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-150 group cursor-pointer"
              >
                <span>Comenzar Ahora</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile Hamburger Toggle & Actions */}
            <div className="lg:hidden flex items-center gap-2 shrink-0">
              <ThemeToggle variant="navbar" />

              <Link
                href="/register"
                className="bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-zinc-950 text-xs font-black px-3.5 py-1.5 rounded-full shadow-sm"
              >
                Comenzar
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-18 z-40 bg-white/98 dark:bg-[#050608]/98 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 p-6 lg:hidden shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </a>
              ))}

              <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex flex-col gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-md transition-colors"
                >
                  Crear Mi Barbería Gratis
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
