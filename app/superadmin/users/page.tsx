'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Filter,
  Shield,
  Building2,
  Lock,
  Unlock,
  Loader2,
  RefreshCw,
  Crown,
  Scissors,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertOctagon
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface UserItem {
  id: string
  email: string
  role: 'SUPER_ADMIN' | 'OWNER' | 'BARBER'
  isActive: boolean
  lastLoginAt?: string | null
  createdAt: string
  businessName: string
  businessId?: string | null
  displayName: string
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter !== 'ALL') params.set('role', roleFilter)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/superadmin/users?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setUsers(json.users || [])
        setTotal(json.total || 0)
      } else {
        toast.error('Error al cargar la lista de usuarios')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 200)
    return () => clearTimeout(timer)
  }, [search, roleFilter, statusFilter])

  const handleToggleStatus = async (user: UserItem) => {
    const nextState = !user.isActive
    const actionName = nextState ? 'Reactivar' : 'Suspender'
    if (!window.confirm(`¿Deseas ${actionName.toLowerCase()} la cuenta de "${user.email}"?`)) return

    setActionLoadingId(user.id)
    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          isActive: nextState
        })
      })

      if (res.ok) {
        toast.success(`Usuario ${nextState ? 'reactivado' : 'suspendido'} con éxito`)
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: nextState } : u))
      } else {
        const json = await res.json()
        toast.error(json.error || 'Error al cambiar estado')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <Users className="w-3 h-3" />
              Directorio de Cuentas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Módulo de Usuarios ({total})
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Supervisa roles, estado de acceso y vinculación de Super Admins, Dueños y Barberos.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-xs cursor-pointer w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo electrónico o barbería asignada..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-950 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Roles</option>
            <option value="SUPER_ADMIN">👑 Super Admin</option>
            <option value="OWNER">🏢 Dueño</option>
            <option value="BARBER">✂️ Barbero</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* ── USERS TABLE ── */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
            <span className="text-xs font-semibold text-zinc-400">Cargando directorio de usuarios...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <Users className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-bold text-zinc-700">No se encontraron usuarios</p>
            <p className="text-xs">Prueba cambiando los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  <th className="py-4 px-6">Nombre</th>
                  <th className="py-4 px-4">Correo</th>
                  <th className="py-4 px-4">Rol</th>
                  <th className="py-4 px-4">Negocio</th>
                  <th className="py-4 px-4">Estado</th>
                  <th className="py-4 px-4">Último Acceso</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                    {/* Nombre */}
                    <td className="py-4 px-6 font-bold text-zinc-950">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-amber-500/10 text-amber-600'
                            : u.role === 'OWNER'
                            ? 'bg-zinc-100 text-zinc-900'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {u.role === 'SUPER_ADMIN' ? '👑' : u.role === 'OWNER' ? '🏢' : '✂️'}
                        </div>
                        <span className="truncate max-w-[160px]">{u.displayName}</span>
                      </div>
                    </td>

                    {/* Correo */}
                    <td className="py-4 px-4 font-mono text-zinc-600 text-[11px]">
                      {u.email}
                    </td>

                    {/* Rol */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : u.role === 'OWNER'
                          ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {u.role === 'SUPER_ADMIN' ? 'Super Admin' : u.role === 'OWNER' ? 'Dueño' : 'Barbero'}
                      </span>
                    </td>

                    {/* Negocio */}
                    <td className="py-4 px-4">
                      {u.businessId ? (
                        <Link
                          href={`/superadmin/businesses/${u.businessId}`}
                          className="font-semibold text-zinc-800 hover:text-amber-600 transition-colors flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3 text-zinc-400" />
                          <span className="truncate max-w-[150px]">{u.businessName}</span>
                        </Link>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">{u.businessName}</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {u.isActive ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>

                    {/* Último Acceso */}
                    <td className="py-4 px-4 text-[11px] text-zinc-500 font-mono">
                      {u.lastLoginAt ? (
                        new Date(u.lastLoginAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      ) : (
                        <span className="text-zinc-400 italic">Nunca</span>
                      )}
                    </td>

                    {/* Acciones: Suspender / Reactivar */}
                    <td className="py-4 px-6 text-right">
                      {u.role !== 'SUPER_ADMIN' ? (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionLoadingId === u.id}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                            u.isActive
                              ? 'bg-zinc-100 text-zinc-700 hover:bg-rose-50 hover:text-rose-600'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={u.isActive ? 'Suspender usuario' : 'Reactivar usuario'}
                        >
                          {actionLoadingId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : u.isActive ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Suspender</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>Reactivar</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">Cuenta Master</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
