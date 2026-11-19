'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function BarberAccessRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  useEffect(() => {
    if (token) {
      router.replace(`/invite/${encodeURIComponent(token)}`)
    } else {
      router.replace('/login')
    }
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">Redirigiendo al portal seguro...</p>
      </div>
    </div>
  )
}
