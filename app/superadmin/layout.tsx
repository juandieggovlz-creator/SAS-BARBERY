import React from 'react'
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar'
import SuperAdminTopBar from '@/components/superadmin/SuperAdminTopBar'
import { SuperAdminThemeManager } from '@/components/superadmin/SuperAdminThemeManager'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminThemeManager>
      <div
        className="min-h-screen flex bg-[#f8fafc] dark:bg-[#09090b] overflow-x-hidden text-zinc-900 dark:text-zinc-100"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Fixed Sidebar escritorio & Drawer móvil */}
        <SuperAdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#09090b] w-full min-w-0">
          {/* Sticky Top Bar con menú móvil integrado */}
          <SuperAdminTopBar />

          {/* Page Content */}
          <main
            className="flex-1 p-3 sm:p-6 md:p-8 w-full max-w-7xl mx-auto min-w-0 pb-16 md:pb-8"
          >
            {children}
          </main>
        </div>
      </div>
    </SuperAdminThemeManager>
  )
}
