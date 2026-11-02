import React from 'react'
import Link from 'next/link'
import { Scissors, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="font-black text-lg tracking-tight">
              Barber<span className="text-amber-500">OS</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" /> Inicio
          </Link>
        </div>
      </header>

      {/* Hero 404 Content */}
      <main className="max-w-lg mx-auto px-5 py-16 text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/5">
            <Scissors className="w-10 h-10 rotate-45" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-black text-xs">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Página no encontrada
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            La página, barbería o enlace al que intentas acceder no existe, ha cambiado de dirección o ha sido retirada del catálogo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            <Home className="w-4 h-4" />
            Ir a la página principal
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm border border-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Acceso a BarberOS
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-400">
        <p>© {new Date().getFullYear()} BarberOS. Plataforma integral para barberías.</p>
      </footer>
    </div>
  )
}
