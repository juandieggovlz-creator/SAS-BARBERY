'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Phone, MapPin, Heart, ShieldCheck, Globe, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer id="footer" className="relative overflow-hidden bg-white dark:bg-[#06070a] border-t border-zinc-200/80 dark:border-white/10 transition-colors duration-300" aria-labelledby="footer-title">
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

            {/* Direct WhatsApp button */}
            <div className="pt-2">
              <a
                href="https://wa.me/573242063393"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-colors"
                aria-label="Contactar por WhatsApp"
              >
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                <span>Contactar por WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0" aria-hidden="true" />
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
                <li key={item.label}>
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
              Legal & Soporte
            </p>
            <ul className="space-y-2.5 text-sm" role="list">
              {[
                { href: '#faq', label: 'Centro de Ayuda & FAQ', isExternal: false },
                { href: '/terminos-y-condiciones', label: 'Términos y Condiciones', isExternal: false },
                { href: '/politica-de-privacidad', label: 'Política de Privacidad', isExternal: false },
                { href: '/seguridad', label: 'Seguridad y Protección de Datos', isExternal: false },
                { href: '/sla', label: 'Acuerdo de Nivel de Servicio (SLA)', isExternal: false },
                { href: 'https://wa.me/573242063393', label: 'Canal de Soporte Oficial', isExternal: true },
              ].map((item) => (
                <li key={item.label}>
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
                    >
                      <span>{item.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Ubicación y Contacto */}
          <div className="space-y-3">
            <p className="font-bold text-zinc-950 dark:text-white uppercase tracking-widest text-xs">
              Contacto
            </p>
            <ul className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Sincelejo, Sucre, Colombia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                <a
                  href="https://wa.me/573242063393"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-500 transition-colors"
                >
                  WhatsApp: +57 324 206 3393
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p>Atención: Lun - Sáb (8am - 7pm)</p>
                  <p className="text-[11px] text-zinc-500">Plataforma en la nube operativa 24/7</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} BarberOS. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Diseñado con precisión para barberos de élite
          </p>
        </div>
      </div>
    </footer>
  )
}
