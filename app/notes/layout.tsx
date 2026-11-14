'use client'

import PanelAccentProvider from '@/components/ui/PanelAccentProvider'

import React, { useState } from 'react'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import TopBar from '@/components/owner/TopBar'
import GlobalSearchModal from '@/components/owner/GlobalSearchModal'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <PanelAccentProvider>
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] font-sans selection:bg-black selection:text-white flex">
      <OwnerSidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#09090b]">
        <TopBar onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full">
          {children}
        </main>
      </div>
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </PanelAccentProvider>
  )
}
