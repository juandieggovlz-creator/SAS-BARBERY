'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Menu, X, ChevronRight } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-3 bg-white/85 backdrop-blur-md border-b border-zinc-200/80 shadow-xs'
            : 'py-5 bg-white/60 backdrop-blur-xs border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-md shadow-zinc-950/15 shrink-0">
                <Image
                  src="/logo.png"
                  alt="BarberOS Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-zinc-950 uppercase flex items-center gap-1.5">
                  Barber<span className="font-light text-zinc-500">OS</span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/80">
                    SaaS
                  </span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-zinc-100/80 p-1.5 rounded-full border border-zinc-200/80">
              {[
                { label: 'Características', href: '#caracteristicas' },
                { label: 'Plataforma', href: '#sistema' },
                { label: 'Página Web', href: '#pagina-web' },
                { label: 'Cómo Funciona', href: '#como-funciona' },
                { label: 'Precios', href: '#precios' },
                { label: 'FAQ', href: '#faq' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-white transition-all"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle variant="navbar" />
              <Link
                href="/login"
                className="text-xs font-bold uppercase tracking-wider text-zinc-700 hover:text-zinc-950 px-4 py-2 rounded-xl transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md shadow-zinc-950/15 active:scale-95 group"
              >
                <span>Comenzar Ahora</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle variant="navbar" />
              <Link
                href="/register"
                className="bg-zinc-950 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs"
              >
                Comenzar
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition-colors"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-18 z-40 bg-white/95 backdrop-blur-xl border-b border-zinc-200 p-6 md:hidden shadow-2xl"
          >
            <div className="flex flex-col gap-3">
              {[
                { label: 'Características', href: '#caracteristicas' },
                { label: 'Plataforma', href: '#sistema' },
                { label: 'Página Web', href: '#pagina-web' },
                { label: 'Cómo Funciona', href: '#como-funciona' },
                { label: 'Precios', href: '#precios' },
                { label: 'FAQ', href: '#faq' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 text-sm font-bold text-zinc-800 border border-transparent hover:border-zinc-200"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </a>
              ))}

              <div className="pt-4 border-t border-zinc-100 flex flex-col gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center rounded-xl border border-zinc-200 text-zinc-800 text-xs font-black uppercase tracking-wider hover:bg-zinc-50"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center rounded-xl bg-zinc-950 text-white text-xs font-black uppercase tracking-wider shadow-lg hover:bg-zinc-800"
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
