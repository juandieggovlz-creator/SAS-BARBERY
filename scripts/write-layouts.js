const fs = require('fs');
const path = require('path');

const normalLayout = `'use client'

import React from 'react'
import OwnerLayoutWrapper from '@/components/owner/OwnerLayoutWrapper'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OwnerLayoutWrapper>{children}</OwnerLayoutWrapper>
}
`;

const fullHeightLayout = `'use client'

import React from 'react'
import OwnerLayoutWrapper from '@/components/owner/OwnerLayoutWrapper'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OwnerLayoutWrapper fullHeight>{children}</OwnerLayoutWrapper>
}
`;

const normalDirs = [
  'appointments',
  'calendar',
  'clients',
  'barbers',
  'services',
  'finances',
  'reports',
  'notes',
  'settings',
  'dashboard',
  'branches',
  'integrations',
  'subscription',
  'support'
];

for (const d of normalDirs) {
  const dir = path.join('app', d);
  if (fs.existsSync(dir)) {
    const layoutPath = path.join(dir, 'layout.tsx');
    fs.writeFileSync(layoutPath, normalLayout, 'utf8');
    console.log('Updated responsive layout.tsx in', dir);
  }
}

const fullHeightDirs = ['webpage', 'chat'];
for (const d of fullHeightDirs) {
  const dir = path.join('app', d);
  if (fs.existsSync(dir)) {
    const layoutPath = path.join(dir, 'layout.tsx');
    fs.writeFileSync(layoutPath, fullHeightLayout, 'utf8');
    console.log('Updated responsive fullHeight layout.tsx in', dir);
  }
}
