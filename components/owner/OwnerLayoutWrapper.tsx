'use client'

import React, { useState } from 'react'
import PanelAccentProvider from '@/components/ui/PanelAccentProvider'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import TopBar from '@/components/owner/TopBar'
import OwnerBottomNav from '@/components/owner/OwnerBottomNav'
import GlobalSearchModal from '@/components/owner/GlobalSearchModal'

interface OwnerLayoutWrapperProps {
  children: React.ReactNode
  fullHeight?: boolean
}

export default function OwnerLayoutWrapper({
  children,
  fullHeight = false,
}: OwnerLayoutWrapperProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <PanelAccentProvider>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] font-sans selection:bg-black selection:text-white flex overflow-x-hidden">
        {/* Sidebar escritorio y Drawer móvil */}
        <OwnerSidebar />

        {/* Área principal de contenido */}
        <div
          className={`flex-1 md:ml-64 flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#09090b] w-full min-w-0 ${
            fullHeight ? 'h-screen overflow-hidden' : ''
          }`}
        >
          {/* TopBar responsiva con menú móvil integrado */}
          <TopBar onOpenSearch={() => setSearchOpen(true)} />

          {/* Contenedor de página con resguardo para BottomNav en móvil */}
          <main
            className={`flex-1 w-full min-w-0 panel-page-enter ${
              fullHeight
                ? 'h-full overflow-hidden'
                : 'p-3 sm:p-6 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8'
            }`}
          >
            {children}
          </main>
        </div>

        {/* Barra inferior ergonómica para móviles */}
        <OwnerBottomNav />

        {/* Modal de búsqueda global */}
        <GlobalSearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
      </div>
    </PanelAccentProvider>
  )
}
