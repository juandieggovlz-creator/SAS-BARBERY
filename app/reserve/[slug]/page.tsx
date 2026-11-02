'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function PublicReservePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  useEffect(() => {
    if (slug) {
      router.replace(`/b/${slug}#reservar`)
    }
  }, [slug, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest font-black text-zinc-400">Cargando reserva...</span>
      </div>
    </div>
  )
}
