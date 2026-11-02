import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, Calendar, Phone, ShieldCheck, Sparkles, Globe, DollarSign } from 'lucide-react';

// Data for each module preview
const modules = [
  {
    id: 'dashboard',
    title: 'Dashboard Dueño',
    icon: <BarChart3 className="w-6 h-6" />, // placeholder icon
    description: 'Visión global de métricas, citas y rendimiento del negocio.',
    // Placeholder image URL or component could be added later
  },
  {
    id: 'barbero',
    title: 'Portal Barbero',
    icon: <Users className="w-6 h-6" />, 
    description: 'Agenda personal, gestión de descansos y acceso a comisiones.',
  },
  {
    id: 'finanzas',
    title: 'Finanzas & Caja',
    icon: <Sparkles className="w-6 h-6" />, 
    description: 'Cierre de caja, reportes de ingresos y control de gastos.',
  },
  {
    id: 'reportes',
    title: 'Reportes & Analítica',
    icon: <BarChart3 className="w-6 h-6" />, 
    description: 'Métricas avanzadas de negocio y tendencias de citas.',
  },
  {
    id: 'agenda',
    title: 'Agenda Inteligente',
    icon: <Calendar className="w-6 h-6" />, 
    description: 'Reservas en tiempo real, detección de solapamientos.',
  },
  {
    id: 'web',
    title: 'Página Web Pública',
    icon: <Globe className="w-6 h-6" />, // need to import Globe later
    description: 'Sitio para reservas 24/7 con marca propia.',
  },
  {
    id: 'comisiones',
    title: 'Comisiones',
    icon: <DollarSign className="w-6 h-6" />, // placeholder
    description: 'Cálculo automático de comisiones por barbero.',
  },
  {
    id: 'inteligencia',
    title: 'Centro de Inteligencia',
    icon: <ShieldCheck className="w-6 h-6" />, 
    description: 'Métricas de retención y alertas del negocio.',
  },
];

export default function SystemShowcase() {
  const [active, setActive] = useState(modules[0].id);
  const activeModule = modules.find((m) => m.id === active)!

  return (
    <section id="system-showcase" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
          DEMOSTRACIÓN DEL SISTEMA
        </h2>
        <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
          Navega por los módulos de BarberOS
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setActive(mod.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
              active === mod.id
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600'
            }`}
          >
            {mod.icon}
            <span className="font-black uppercase text-sm">{mod.title}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeModule.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8"
        >
          <div className="flex-shrink-0 text-white">
            {activeModule.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-2xl font-black text-white uppercase mb-2">
              {activeModule.title}
            </h4>
            <p className="text-zinc-400 max-w-2xl">
              {activeModule.description}
            </p>
            {/* Placeholder image preview – developers can replace with real mockup */}
            <div className="mt-6 w-full h-48 bg-zinc-900 rounded-xl border border-zinc-800" />
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
