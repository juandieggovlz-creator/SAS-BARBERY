const fs = require('fs');
const path = require('path');

const layoutContent = [
  "'use client'",
  "",
  "import React, { useState } from 'react'",
  "import OwnerSidebar from '@/components/owner/OwnerSidebar'",
  "import TopBar from '@/components/owner/TopBar'",
  "import GlobalSearchModal from '@/components/owner/GlobalSearchModal'",
  "",
  "export default function AdminLayout({ children }: { children: React.ReactNode }) {",
  "  const [searchOpen, setSearchOpen] = useState(false)",
  "",
  "  return (",
  "    <div className=\"min-h-screen bg-[#f8fafc] font-sans selection:bg-black selection:text-white flex\">",
  "      <OwnerSidebar />",
  "      <div className=\"flex-1 md:ml-64 flex flex-col min-h-screen\">",
  "        <TopBar onOpenSearch={() => setSearchOpen(true)} />",
  "        <main className=\"flex-1 p-4 sm:p-8 md:p-10 max-w-7xl w-full mx-auto\">",
  "          {children}",
  "        </main>",
  "      </div>",
  "      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />",
  "    </div>",
  "  )",
  "}",
  ""
].join('\n');

const dirs = ['appointments', 'calendar', 'clients', 'barbers', 'services', 'finances', 'reports', 'notes', 'chat', 'settings', 'dashboard'];

for (const d of dirs) {
  const dir = path.join('app', d);
  if (fs.existsSync(dir)) {
    const layoutPath = path.join(dir, 'layout.tsx');
    fs.writeFileSync(layoutPath, layoutContent, 'utf8');
    console.log('Written typed layout.tsx to', dir);
  }
}
