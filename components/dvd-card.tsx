'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dvd } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrailerDialog } from '@/components/trailer-dialog'
import { Pencil, Trash2, Film, Play } from 'lucide-react'

export function formatNumero(numero: number, total: number): string {
  const digits = total > 99 ? 3 : total > 9 ? 2 : 1
  return String(numero).padStart(digits, '0')
}

interface DvdCardProps {
  dvd: Dvd
  total: number
  onEdit?: (dvd: Dvd) => void
  onDelete?: (dvd: Dvd) => void
}

export function DvdCard({ dvd, total, onEdit, onDelete }: DvdCardProps) {
  const [trailerOpen, setTrailerOpen] = useState(false)

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-transform hover:scale-[1.02]">
        {/* Poster */}
        <div className="relative aspect-[2/3] w-full bg-muted">
          {dvd.poster_url ? (
            <Image
              src={dvd.poster_url}
              alt={dvd.titulo}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}

          {/* Badge número */}
          <Badge
            variant="secondary"
            className="absolute top-1.5 left-1.5 font-mono text-[10px] opacity-90"
          >
            #{formatNumero(dvd.numero, total)}
          </Badge>

          {/* Badge prestado */}
          {dvd.estado === 'prestado' && (
            <Badge variant="destructive" className="absolute top-1.5 right-1.5 text-[10px]">
              Prestado
            </Badge>
          )}

          {/* Overlay: hover en desktop, siempre visible en touch */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100">
            {dvd.tmdb_id && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5 text-xs"
                onClick={() => setTrailerOpen(true)}
              >
                <Play className="h-3.5 w-3.5" />
                Trailer
              </Button>
            )}
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => onEdit(dvd)}
                  aria-label="Editar DVD"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => onDelete(dvd)}
                  aria-label="Eliminar DVD"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-0.5 p-2">
          <p className="truncate text-xs font-medium leading-tight">{dvd.titulo}</p>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {dvd.año && <span>{dvd.año}</span>}
            {dvd.año && dvd.formato && <span>·</span>}
            <span>{dvd.formato}</span>
          </div>
          {dvd.genero && (
            <p className="truncate text-[10px] text-muted-foreground/70">{dvd.genero}</p>
          )}
        </div>
      </div>

      <TrailerDialog
        tmdbId={dvd.tmdb_id ?? null}
        titulo={dvd.titulo}
        open={trailerOpen}
        onOpenChange={setTrailerOpen}
      />
    </>
  )
}
