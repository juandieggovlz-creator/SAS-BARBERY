'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, MapPin, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-200/90 text-zinc-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shrink-0">
                <Image
                  src="/logo.png"
                  alt="BarberOS Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-black tracking-tight text-zinc-950 uppercase">
                Barber<span className="font-light text-zinc-400">OS</span>
              </span>
            </Link>

            <p className="text-zinc-500 max-w-sm leading-relaxed text-xs">
              El sistema operativo integral para barberías y salones modernos. Automatiza reservas, controla finanzas, gestiona comisiones y multiplica tus clientes.
            </p>

            <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-zinc-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Plataforma 100% Operativa y Segura</span>
            </div>
          </div>

          {/* Col 1: Producto */}
          <div className="space-y-3">
            <p className="font-black text-zinc-950 uppercase tracking-widest text-[11px]">Producto</p>
            <ul className="space-y-2">
              <li><a href="#sistema" className="hover:text-zinc-950 transition-colors">Dashboard Administrador</a></li>
              <li><a href="#sistema" className="hover:text-zinc-950 transition-colors">Portal para Barberos</a></li>
              <li><a href="#sistema" className="hover:text-zinc-950 transition-colors">Cierre de Caja &amp; Arqueo</a></li>
              <li><a href="#pagina-web" className="hover:text-zinc-950 transition-colors">Página Web de Reservas</a></li>
              <li><a href="#caracteristicas" className="hover:text-zinc-950 transition-colors">Comisiones Automáticas</a></li>
              <li><a href="#precios" className="hover:text-zinc-950 transition-colors">Planes &amp; Precios</a></li>
            </ul>
          </div>

          {/* Col 2: Legal & Soporte */}
          <div className="space-y-3">
            <p className="font-black text-zinc-950 uppercase tracking-widest text-[11px]">Soporte &amp; Legal</p>
            <ul className="space-y-2">
              <li><Link href="/terminos-y-condiciones" className="hover:text-zinc-950 transition-colors">Términos y Condiciones</Link></li>
              <li><Link href="/politica-de-privacidad" className="hover:text-zinc-950 transition-colors">Política de Privacidad</Link></li>
              <li><Link href="/politica-de-cookies" className="hover:text-zinc-950 transition-colors">Política de Cookies</Link></li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('open-cookie-preferences'))
                    }
                  }}
                  className="hover:text-zinc-950 transition-colors cursor-pointer text-left font-medium"
                >
                  Gestionar Cookies
                </button>
              </li>
              <li><a href="#faq" className="hover:text-zinc-950 transition-colors">Preguntas Frecuentes (FAQ)</a></li>
              <li><Link href="/login" className="hover:text-zinc-950 transition-colors">Acceso a BarberOS</Link></li>
            </ul>
          </div>

          {/* Col 3: Contacto */}
          <div className="space-y-3">
            <p className="font-black text-zinc-950 uppercase tracking-widest text-[11px]">Contacto Directo</p>
            <div className="space-y-2 text-zinc-500">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                <a href="tel:+573242063393" className="hover:text-zinc-950 transition-colors">+57 324 206 3393</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                <span>Sincelejo, Sucre</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
          <p>© {new Date().getFullYear()} BarberOS. Plataforma SaaS de Gestión para Barberías. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Diseñado con <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> para los mejores profesionales del corte.
          </p>
        </div>
      </div>
    </footer>
  )
}
