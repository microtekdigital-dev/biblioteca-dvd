'use client'

import { useState, useCallback, useRef } from 'react'
import useSWR from 'swr'
import { Dvd } from '@/lib/types'
import { DvdFormValues } from '@/lib/schemas/dvd'
import { DvdCard } from '@/components/dvd-card'
import { DvdForm } from '@/components/dvd-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function filterDvds(dvds: Dvd[], search: string): Dvd[] {
  const term = search.trim().toLowerCase()
  if (!term) return dvds
  const numTerm = parseInt(term, 10)
  return dvds.filter(
    (d) =>
      d.titulo.toLowerCase().includes(term) ||
      d.director?.toLowerCase().includes(term) ||
      d.genero?.toLowerCase().includes(term) ||
      (!isNaN(numTerm) && d.numero === numTerm)
  )
}

/** Agrupa DVDs por género. Un DVD puede aparecer en múltiples géneros. */
function groupByGenero(dvds: Dvd[]): { genero: string; items: Dvd[] }[] {
  const map = new Map<string, Dvd[]>()

  for (const dvd of dvds) {
    const genres = dvd.genero
      ? dvd.genero.split(',').map((g) => g.trim()).filter(Boolean)
      : ['Sin género']

    for (const g of genres) {
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(dvd)
    }
  }

  // Ordenar secciones: primero géneros con nombre, luego "Sin género"
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === 'Sin género') return 1
      if (b === 'Sin género') return -1
      return a.localeCompare(b)
    })
    .map(([genero, items]) => ({ genero, items }))
}

function generoId(genero: string) {
  return 'genero-' + genero.toLowerCase().replace(/[^a-z0-9]/g, '-')
}

interface GeneroRowProps {
  genero: string
  items: Dvd[]
  total: number
  onEdit: (dvd: Dvd) => void
  onDelete: (dvd: Dvd) => void
}

function GeneroRow({ genero, items, total, onEdit, onDelete }: GeneroRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' })
  }

  return (
    <div id={generoId(genero)} className="space-y-2 scroll-mt-20">
      <h2 className="text-sm font-semibold tracking-wide text-foreground/90 sm:text-base">
        {genero}
        <span className="ml-2 text-xs font-normal text-muted-foreground">({items.length})</span>
      </h2>
      <div className="group/row relative">
        {/* Botón izquierda */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 z-10 hidden h-full w-8 items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 transition-opacity group-hover/row:flex group-hover/row:opacity-100"
          aria-label="Scroll izquierda"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Fila scrolleable */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((dvd) => (
            <div
              key={dvd.id}
              className="w-[100px] shrink-0 sm:w-[120px] lg:w-[140px]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <DvdCard
                dvd={dvd}
                total={total}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>

        {/* Botón derecha */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 z-10 hidden h-full w-8 items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 transition-opacity group-hover/row:flex group-hover/row:opacity-100"
          aria-label="Scroll derecha"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export function CatalogView() {
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingDvd, setEditingDvd] = useState<Dvd | null>(null)
  const [deletingDvd, setDeletingDvd] = useState<Dvd | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: rawData, mutate } = useSWR('/api/dvds', fetcher)
  const dvds: Dvd[] = Array.isArray(rawData) ? rawData : []

  const filtered = filterDvds(dvds, search)
  const sections = groupByGenero(filtered)

  // Estadísticas globales (sobre todos los DVDs, no los filtrados)
  const totalPeliculas = dvds.length
  const generoStats = (() => {
    const map = new Map<string, number>()
    for (const dvd of dvds) {
      const genres = dvd.genero
        ? dvd.genero.split(',').map((g) => g.trim()).filter(Boolean)
        : []
      for (const g of genres) {
        map.set(g, (map.get(g) ?? 0) + 1)
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
  })()

  // Últimas agregadas: ordenadas por fecha_agregado o created_at desc, top 20
  const ultimasAgregadas = [...dvds]
    .sort((a, b) => {
      const da = a.created_at ?? a.fecha_agregado ?? ''
      const db = b.created_at ?? b.fecha_agregado ?? ''
      return db.localeCompare(da)
    })
    .slice(0, 20)

  const handleCreate = useCallback(async (values: DvdFormValues) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/dvds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (res.status === 409) {
        const data = await res.json()
        setSubmitError(data.error ?? 'Este número ya está en uso en tu colección')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error ?? `Error ${res.status} al crear el DVD`)
        return
      }
      await mutate()
      setIsCreateOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }, [mutate])

  const handleEdit = useCallback(async (values: DvdFormValues) => {
    if (!editingDvd) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/dvds/${editingDvd.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (res.status === 409) {
        const data = await res.json()
        setSubmitError(data.error ?? 'Este número ya está en uso en tu colección')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error ?? `Error ${res.status} al actualizar el DVD`)
        return
      }
      await mutate()
      setEditingDvd(null)
    } finally {
      setIsSubmitting(false)
    }
  }, [editingDvd, mutate])

  const handleDelete = useCallback(async () => {
    if (!deletingDvd) return
    setIsSubmitting(true)
    try {
      await fetch(`/api/dvds/${deletingDvd.id}`, { method: 'DELETE' })
      await mutate()
      setDeletingDvd(null)
    } finally {
      setIsSubmitting(false)
    }
  }, [deletingDvd, mutate])

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {totalPeliculas > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            📀 {totalPeliculas} {totalPeliculas === 1 ? 'película' : 'películas'}
          </span>
          {generoStats.length > 0 && (
            <>
              <span className="hidden sm:inline text-border">|</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {generoStats.map(([genero, count]) => (
                  <button
                    key={genero}
                    onClick={() => {
                      setSearch('')
                      setTimeout(() => {
                        document.getElementById(generoId(genero))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 50)
                    }}
                    className="hover:text-foreground hover:underline transition-colors cursor-pointer"
                  >
                    {genero} <span className="text-xs">({count})</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Barra de herramientas */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 sm:w-72"
          aria-label="Buscar DVDs"
        />
        <Button onClick={() => { setSubmitError(null); setIsCreateOpen(true) }} className="ml-auto shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Agregar DVD</span>
        </Button>
      </div>

      {/* Secciones por género */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {search ? 'No se encontraron resultados.' : 'Tu colección está vacía. ¡Agrega tu primer DVD!'}
        </p>
      ) : (
        <div className="space-y-8">
          {/* Últimas agregadas — solo sin búsqueda activa */}
          {!search && ultimasAgregadas.length > 0 && (
            <GeneroRow
              genero="🕐 Últimas agregadas"
              items={ultimasAgregadas}
              total={dvds.length}
              onEdit={(d) => { setSubmitError(null); setEditingDvd(d) }}
              onDelete={setDeletingDvd}
            />
          )}
          {sections.map(({ genero, items }) => (
            <GeneroRow
              key={genero}
              genero={genero}
              items={items}
              total={dvds.length}
              onEdit={(d) => { setSubmitError(null); setEditingDvd(d) }}
              onDelete={setDeletingDvd}
            />
          ))}
        </div>
      )}

      {/* Diálogo: crear DVD */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar DVD</DialogTitle>
          </DialogHeader>
          <DvdForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo: editar DVD */}
      <Dialog open={!!editingDvd} onOpenChange={(open) => !open && setEditingDvd(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar DVD</DialogTitle>
          </DialogHeader>
          {editingDvd && (
            <DvdForm
              dvd={editingDvd}
              onSubmit={handleEdit}
              onCancel={() => setEditingDvd(null)}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo: confirmar eliminación */}
      <Dialog open={!!deletingDvd} onOpenChange={(open) => !open && setDeletingDvd(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar DVD</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que quieres eliminar{' '}
            <span className="font-medium text-foreground">{deletingDvd?.titulo}</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletingDvd(null)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
