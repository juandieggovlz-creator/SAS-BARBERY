'use client'

import React from 'react'
import OwnerLayoutWrapper from '@/components/owner/OwnerLayoutWrapper'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OwnerLayoutWrapper>{children}</OwnerLayoutWrapper>
}
