'use client'

import React, { useState } from 'react'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import TopBar from '@/components/owner/TopBar'
import GlobalSearchModal from '@/components/owner/GlobalSearchModal'
import ImpersonationBanner from '@/components/ImpersonationBanner'

export default function IntegrationsLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] font-sans selection:bg-black selection:text-white flex flex-col">
      <ImpersonationBanner />
      <div className="flex-1 flex">
        <OwnerSidebar />
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
          <TopBar onOpenSearch={() => setSearchOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 md:p-8 w-full">
            {children}
          </main>
        </div>
      </div>
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
