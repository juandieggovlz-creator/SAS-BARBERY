'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Calendar as CalendarIcon, Clock, Trash2, Plus, Ban } from 'lucide-react'

interface Block {
  id: string
  date: string
  startTime: string
  endTime: string
  reason?: string | null
}

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [showModal, setShowModal] = useState(false)
  
  const [newBlock, setNewBlock] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '13:00',
    endTime: '14:00',
    reason: 'Almuerzo'
  })

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const res = await fetch('/api/barber/blocks')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data)) setBlocks(data)
        }
      } catch {
        toast.error('Error al cargar bloqueos')
      }
    }
    void load()
    return () => { isMounted = false }
  }, [])

  const fetchBlocks = async () => {
    try {
      const res = await fetch('/api/barber/blocks')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setBlocks(data)
      }
    } catch {
      toast.error('Error al cargar bloqueos')
    }
  }

  const handleAddBlock = async () => {
    try {
      const res = await fetch('/api/barber/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlock)
      })
      if (res.ok) {
        toast.success('Horario bloqueado')
        setShowModal(false)
        fetchBlocks()
      }
    } catch {
      toast.error('Error al bloquear')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/barber/blocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        toast.success('Bloqueo eliminado')
        fetchBlocks()
      }
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-black uppercase tracking-tighter">Bloquear Tiempo</h2>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-2 ml-1">Descansos y Ausencias</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl"
        >
          <Plus size={16} />
          Bloquear Horario
        </button>
      </header>

      <div className="grid gap-4">
        {blocks.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-zinc-200 rounded-3xl">
             <Ban className="mx-auto text-zinc-200 mb-4" size={48} />
             <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">No hay bloqueos activos</p>
          </div>
        ) : (
          blocks.map((block) => (
            <div key={block.id} className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <div className="text-sm font-black text-black uppercase">
                    {new Date(block.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                    <Clock size={12} /> {block.startTime} - {block.endTime} • <span className="text-black">{block.reason || 'Sin motivo'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(block.id)}
                className="p-3 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-black uppercase tracking-tighter mb-6">Nuevo Bloqueo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Fecha</label>
                <input
                  type="date"
                  value={newBlock.date}
                  onChange={(e) => setNewBlock({...newBlock, date: e.target.value})}
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-black focus:border-black outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Inicio</label>
                  <input
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({...newBlock, startTime: e.target.value})}
                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-black focus:border-black outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Fin</label>
                  <input
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({...newBlock, endTime: e.target.value})}
                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-black focus:border-black outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Motivo</label>
                <input
                  type="text"
                  placeholder="Ej. Almuerzo, Cita médica..."
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})}
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-black focus:border-black outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 px-4 rounded-xl text-[10px] font-black text-zinc-400 bg-zinc-100 hover:bg-zinc-200 transition-all uppercase tracking-[0.2em]"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddBlock}
                className="flex-1 py-4 px-4 rounded-xl text-[10px] font-black text-white bg-black hover:bg-zinc-800 transition-all uppercase tracking-[0.2em] shadow-lg shadow-black/20"
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
