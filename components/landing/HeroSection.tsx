import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Scissors, ArrowRight, Sparkles, BarChart3, ShieldCheck } from 'lucide-react';
import BarberPoleLoader from '@/components/public/BarberPoleLoader';

export default function HeroSection() {
  return (
    <section className="relative pt-20 pb-28 md:pt-32 md:pb-40 px-6 max-w-7xl mx-auto">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="text-center max-w-4xl mx-auto space-y-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-black uppercase tracking-widest text-zinc-300"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          Software de Gestión Premium
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase leading-[1.05]"
        >
          El sistema operativo <br className="hidden sm:inline" />
          <span className="text-zinc-400 italic font-serif">barbería</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-xl text-zinc-400 font-normal max-w-2xl mx-auto leading-relaxed"
        >
          Gestiona citas, barberos, clientes y reservas online desde una sola plataforma diseñada para hacer crecer tu negocio.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link
            href="/register"
            className="w-full sm:w-auto bg-white text-black font-black uppercase tracking-wider text-xs px-8 py-4 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-white/10 active:scale-95 group"
          >
            <span>Crear mi barbería</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#system-showcase"
            className="w-full sm:w-auto border border-zinc-800 text-zinc-300 font-bold uppercase tracking-wider text-xs px-8 py-4 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all text-center"
          >
            Ver demostración
          </a>
        </motion.div>
        {/* Dashboard Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 md:mt-24 relative max-w-5xl mx-auto"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-black/80 backdrop-blur-2xl relative overflow-hidden">
            {/* Browser Dots Bar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
              </div>
              <div className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-4 py-1 rounded-md border border-zinc-800/60">
                barberos.app/dashboard
              </div>
              <div className="w-12" />
            </div>
            {/* Dashboard Content */}
            <div className="bg-zinc-950 rounded-2xl p-4 sm:p-6 border border-zinc-800/60 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800/80">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Citas Hoy</p>
                <p className="text-2xl font-black text-white mt-1">24</p>
              </div>
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800/80">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Confirmadas</p>
                <p className="text-2xl font-black text-white mt-1">18</p>
              </div>
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800/80">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Completadas</p>
                <p className="text-2xl font-black text-white mt-1">6</p>
              </div>
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800/80">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Barberos Activos</p>
                <p className="text-2xl font-black text-white mt-1">4</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
