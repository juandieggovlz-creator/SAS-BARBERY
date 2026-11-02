'use client'

import React, { useState } from 'react'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import TopBar from '@/components/owner/TopBar'
import GlobalSearchModal from '@/components/owner/GlobalSearchModal'

export default function WebpageLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-black selection:text-white flex">
      <OwnerSidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen h-screen overflow-hidden">
        <TopBar onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 w-full h-full overflow-hidden">
          {children}
        </main>
      </div>
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
