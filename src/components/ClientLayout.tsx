'use client'

import { useRealtime } from '@/hooks/useRealtime'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ativar Realtime globalmente
  useRealtime()

  return <>{children}</>
} 