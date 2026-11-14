'use client'

import React from 'react'
import Link from 'next/link'
import { LEGAL_DOCUMENTS } from '@/lib/legal-documents'
import {
  ShieldCheck,
  Shield,
  Cookie,
  FileCheck,
  RotateCcw,
  CreditCard,
  Server,
  Lock
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  ShieldCheck,
  Shield,
  Cookie,
  FileCheck,
  RotateCcw,
  CreditCard,
  Server,
  Lock
}

interface LegalNavProps {
  currentSlug: string
}

export default function LegalNav({ currentSlug }: LegalNavProps) {
  const cleanCurrent = currentSlug.toLowerCase().replace(/^\//, '').trim()

  return (
    <nav
      className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/90 dark:bg-[#121215] sticky top-[65px] z-30 backdrop-blur-md transition-colors"
      aria-label="Navegación de documentos legales y políticas"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {LEGAL_DOCUMENTS.map((doc) => {
            const Icon = ICON_MAP[doc.iconName] || ShieldCheck
            const isActive =
              doc.slug === cleanCurrent ||
              (doc.aliases && doc.aliases.some((a) => a.replace(/^\//, '') === cleanCurrent))

            return (
              <Link
                key={doc.id}
                href={doc.route}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20 font-black ring-1 ring-amber-600'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-400 dark:text-zinc-500'}`} />
                <span>{doc.shortTitle}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

