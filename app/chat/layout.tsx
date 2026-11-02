'use client'

import React, { useState } from 'react'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import TopBar from '@/components/owner/TopBar'
import GlobalSearchModal from '@/components/owner/GlobalSearchModal'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="h-screen bg-[#f8fafc] font-sans selection:bg-black selection:text-white flex overflow-hidden">
      <OwnerSidebar />
      <div className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        <TopBar onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 p-2 sm:p-3 md:p-4 w-full flex flex-col min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
