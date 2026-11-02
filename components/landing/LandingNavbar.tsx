import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, BarChart3, Check, Users, Calendar, Phone, ShieldCheck } from 'lucide-react';

export default function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden transition-transform group-hover:scale-105 shadow-md shadow-white/10 shrink-0">
            <Image
              src="/logo.png"
              alt="BarberOS Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">
            Barber<span className="font-light text-zinc-400">OS</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-400">
          <a href="#caracteristicas" className="hover:text-white transition-colors py-1">Características</a>
          <a href="#como-funciona" className="hover:text-white transition-colors py-1">Cómo funciona</a>
          <a href="#precios" className="hover:text-white transition-colors py-1">Precios</a>
          <a href="#faq" className="hover:text-white transition-colors py-1">FAQ</a>
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white px-4 py-2.5 transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/register" className="bg-white text-black text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-zinc-200 transition-all shadow-lg shadow-white/5 active:scale-95 flex items-center gap-2 group">
            <span>Crear mi barbería</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
