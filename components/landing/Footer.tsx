'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Phone, MapPin, Heart, ShieldCheck, Globe, X, MessageSquare, Link2, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer id="footer" className="relative overflow-hidden bg-white dark:bg-[#070709] border-t border-zinc-200/80 dark:border-zinc-800/80 transition-colors duration-300" aria-labelledby="footer-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3" aria-label="BarberOS - Inicio">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0">
                <Image
                  src="/logo.png"
                  alt="BarberOS Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-white uppercase">
                Barber<span className="font-light text-zinc-500 dark:text-zinc-400">OS</span>
              </span>
            </Link>

            <p className="text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed text-sm">
              El sistema operativo integral para barberías y salones modernos. Automatiza reservas, controla finanzas, gestiona comisiones y multiplica tus clientes.
            </p>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Plataforma 100% Operativa y Segura</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-amber-500 transition-colors"
                aria-label="Instagram"
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-amber-500 transition-colors"
                aria-label="X (Twitter)"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-amber-500 transition-colors"
                aria-label="LinkedIn"
              >
                <Link2 className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Col 1: Producto */}
          <div className="space-y-3">
            <p className="font-bold text-zinc-950 dark:text-white uppercase tracking-widest text-xs">
              Producto
            </p>
            <ul className="space-y-2.5 text-sm" role="list">
              {[
                { href: '#sistema', label: 'Dashboard Administrador' },
                { href: '#sistema', label: 'Portal para Barberos' },
                { href: '#sistema', label: 'Cierre de Caja & Arqueo' },
                { href: '#pagina-web', label: 'Página Web de Reservas' },
                { href: '#caracteristicas', label: 'Comisiones Automáticas' },
                { href: '#precios', label: 'Planes & Precios' },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2: Soporte & Legal */}
          <div className="space-y-3">
            <p className="font-bold text-zinc-950 dark:text-white uppercase tracking-widest text-xs">
              Soporte & Legal
            </p>
            <ul className="space-y-2.5 text-sm" role="list">
              {[
                { href: '/terminos-y-condiciones', label: 'Términos y Condiciones' },
                { href: '/politica-de-privacidad', label: 'Política de Privacidad' },
                { href: '/politica-de-cookies', label: 'Política de Cookies' },
                { href: '#faq', label: 'Preguntas Frecuentes (FAQ)' },
                { href: '/login', label: 'Acceso a BarberOS' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Contacto */}
          <div className="space-y-3">
            <p className="font-bold text-zinc-950 dark:text-white uppercase tracking-widest text-xs">
              Contacto Directo
            </p>
            <div className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <a
                href="tel:+573242063393"
                className="flex items-center gap-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0 text-zinc-400" aria-hidden="true" />
                <span>+57 324 206 3393</span>
              </a>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 shrink-0 text-zinc-400" aria-hidden="true" />
                <span>Sincelejo, Sucre · Colombia</span>
              </div>
            </div>

            {/* Badges mini */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                Datos Encriptados
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Heart className="w-3 h-3 fill-current" aria-hidden="true" />
                Hecho en Colombia
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} BarberOS. Plataforma SaaS de Gestión para Barberías. Todos los derechos reservados.
          </p>
          <p className="flex items-center gap-1 text-center sm:text-right">
            Diseñado con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" aria-hidden="true" /> para los mejores profesionales del corte.
          </p>
        </div>
      </div>
    </footer>
  )
}
