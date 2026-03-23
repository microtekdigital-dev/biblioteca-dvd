'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TrailerDialogProps {
  tmdbId: string | null
  titulo: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrailerDialog({ tmdbId, titulo, open, onOpenChange }: TrailerDialogProps) {
  const [youtubeKey, setYoutubeKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open || !tmdbId) return
    setLoading(true)
    setError(false)
    setYoutubeKey(null)
    fetch(`/api/tmdb/trailer?tmdb_id=${tmdbId}`)
      .then((r) => r.json())
      .then((data) => {
        setYoutubeKey(data.youtubeKey ?? null)
        if (!data.youtubeKey) setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [open, tmdbId])

  // Limpiar al cerrar
  function handleOpenChange(val: boolean) {
    if (!val) setYoutubeKey(null)
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="truncate">{titulo}</DialogTitle>
        </DialogHeader>

        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-muted-foreground">
              Cargando trailer...
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-muted-foreground">
              No se encontró trailer disponible.
            </div>
          )}
          {youtubeKey && (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1`}
              title={`Trailer de ${titulo}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
