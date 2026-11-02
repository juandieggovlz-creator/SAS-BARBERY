import React from 'react'
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar'
import SuperAdminTopBar from '@/components/superadmin/SuperAdminTopBar'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex bg-[#f8fafc] dark:bg-[#09090b]"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Fixed Sidebar */}
      <SuperAdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#09090b]">
        {/* Sticky Top Bar */}
        <SuperAdminTopBar />

        {/* Page Content */}
        <main
          className="flex-1 p-5 sm:p-6 md:p-8 w-full max-w-7xl mx-auto"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
