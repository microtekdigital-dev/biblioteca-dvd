'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CatalogView } from '@/components/catalog-view'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between">
          <h1 className="text-base font-bold sm:text-lg">📀 Mi colección</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-screen-2xl px-3 py-4 sm:px-6 sm:py-6">
        <CatalogView />
      </main>
    </div>
  )
}
