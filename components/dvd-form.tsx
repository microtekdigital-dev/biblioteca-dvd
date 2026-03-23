'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dvdSchema, DvdFormValues } from '@/lib/schemas/dvd'
import { Dvd } from '@/lib/types'
import { useNextNumero } from '@/hooks/use-next-numero'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Search, X } from 'lucide-react'

interface TmdbResult {
  tmdb_id: string
  titulo: string
  titulo_original: string
  año?: number
  genero?: string
  director?: string
  sinopsis: string
  poster_url: string
}

interface DvdFormProps {
  dvd?: Dvd
  onSubmit: (values: DvdFormValues) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  submitError?: string | null
}

export function DvdForm({ dvd, onSubmit, onCancel, isSubmitting, submitError }: DvdFormProps) {
  const isEditing = !!dvd
  const { nextNumero } = useNextNumero()

  // TMDB search state
  const [tmdbQuery, setTmdbQuery] = useState('')
  const [tmdbResults, setTmdbResults] = useState<TmdbResult[]>([])
  const [tmdbLoading, setTmdbLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm<DvdFormValues>({
    defaultValues: {
      numero: dvd?.numero ?? undefined,
      titulo: dvd?.titulo ?? '',
      titulo_original: dvd?.titulo_original ?? '',
      año: dvd?.año ?? undefined,
      director: dvd?.director ?? '',
      genero: dvd?.genero ?? '',
      duracion: dvd?.duracion ?? undefined,
      sinopsis: dvd?.sinopsis ?? '',
      poster_url: dvd?.poster_url ?? '',
      tmdb_id: dvd?.tmdb_id ?? '',
      ubicacion: dvd?.ubicacion ?? '',
      formato: dvd?.formato ?? 'DVD',
      estado: dvd?.estado ?? 'disponible',
      notas: dvd?.notas ?? '',
      calificacion: dvd?.calificacion ?? undefined,
    },
  })

  // Pre-rellenar numero con el siguiente disponible al crear
  useEffect(() => {
    if (!isEditing && nextNumero !== null && !form.getValues('numero')) {
      form.setValue('numero', nextNumero)
    }
  }, [nextNumero, isEditing, form])

  // Resetear el formulario cuando cambia el dvd (al abrir editar otra película)
  useEffect(() => {
    if (dvd) {
      form.reset({
        numero: dvd.numero,
        titulo: dvd.titulo,
        titulo_original: dvd.titulo_original ?? '',
        año: dvd.año ?? undefined,
        director: dvd.director ?? '',
        genero: dvd.genero ?? '',
        duracion: dvd.duracion ?? undefined,
        sinopsis: dvd.sinopsis ?? '',
        poster_url: dvd.poster_url ?? '',
        tmdb_id: dvd.tmdb_id ?? '',
        ubicacion: dvd.ubicacion ?? '',
        formato: dvd.formato,
        estado: dvd.estado,
        notas: dvd.notas ?? '',
        calificacion: dvd.calificacion ?? undefined,
      })
    }
  }, [dvd?.id, form]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Buscar en TMDB con debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (tmdbQuery.length < 2) {
      setTmdbResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setTmdbLoading(true)
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(tmdbQuery)}`)
        const data = await res.json()
        setTmdbResults(Array.isArray(data) ? data : [])
        setShowResults(true)
      } finally {
        setTmdbLoading(false)
      }
    }, 400)
  }, [tmdbQuery])

  function applyTmdbResult(result: TmdbResult) {
    form.setValue('titulo', result.titulo)
    form.setValue('titulo_original', result.titulo_original)
    if (result.año) form.setValue('año', result.año)
    if (result.genero) form.setValue('genero', result.genero)
    if (result.director) form.setValue('director', result.director)
    if (result.sinopsis) form.setValue('sinopsis', result.sinopsis)
    if (result.poster_url) form.setValue('poster_url', result.poster_url)
    form.setValue('tmdb_id', result.tmdb_id)
    setTmdbQuery('')
    setShowResults(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(async (values) => { console.log('submit values:', values); await onSubmit(values) }, (errors) => console.error('Validation errors:', errors))} className="space-y-4">

        {/* Buscador TMDB */}
        <div className="space-y-1" ref={searchRef}>
          <p className="text-sm font-medium">Buscar en TMDB (autocompletar)</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Escribe el título para buscar..."
              value={tmdbQuery}
              onChange={(e) => setTmdbQuery(e.target.value)}
              className="pl-9"
            />
            {tmdbQuery && (
              <button
                type="button"
                onClick={() => { setTmdbQuery(''); setShowResults(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Resultados */}
          {showResults && (
            <div className="absolute z-50 mt-1 w-full max-w-lg rounded-md border bg-popover shadow-lg">
              {tmdbLoading && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Buscando...</p>
              )}
              {!tmdbLoading && tmdbResults.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
              )}
              {!tmdbLoading && tmdbResults.map((r) => (
                <button
                  key={r.tmdb_id}
                  type="button"
                  onClick={() => applyTmdbResult(r)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {r.poster_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.poster_url} alt={r.titulo} className="h-12 w-8 rounded object-cover" />
                  )}
                  <div>
                    <p className="font-medium">{r.titulo}</p>
                    {r.titulo_original !== r.titulo && (
                      <p className="text-xs text-muted-foreground">{r.titulo_original}</p>
                    )}
                    {r.año && <p className="text-xs text-muted-foreground">{r.año}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <hr className="border-border" />

        {/* Número de película */}
        <FormField
          control={form.control}
          name="numero"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de película</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="Ej: 1"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    field.onChange(isNaN(v) ? undefined : v)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Título */}
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input placeholder="Título de la película" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Título original */}
        <FormField
          control={form.control}
          name="titulo_original"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título original</FormLabel>
              <FormControl>
                <Input placeholder="Original title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Año */}
          <FormField
            control={form.control}
            name="año"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Año</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="2024"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber
                      field.onChange(isNaN(v) ? undefined : v)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duración */}
          <FormField
            control={form.control}
            name="duracion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="120"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber
                      field.onChange(isNaN(v) ? undefined : v)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Director */}
        <FormField
          control={form.control}
          name="director"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Director</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del director" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Género */}
        <FormField
          control={form.control}
          name="genero"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Género</FormLabel>
              <FormControl>
                <Input placeholder="Acción, Drama, Comedia..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Poster URL */}
        <FormField
          control={form.control}
          name="poster_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del poster</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              {field.value && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={field.value} alt="poster" className="mt-1 h-24 w-16 rounded object-cover" />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Formato */}
          <FormField
            control={form.control}
            name="formato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formato</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar formato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DVD">DVD</SelectItem>
                    <SelectItem value="Blu-ray">Blu-ray</SelectItem>
                    <SelectItem value="4K">4K</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Estado */}
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="prestado">Prestado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ubicación */}
        <FormField
          control={form.control}
          name="ubicacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                <Input placeholder="Estante A, Caja 3..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sinopsis */}
        <FormField
          control={form.control}
          name="sinopsis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sinopsis</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción de la película..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notas */}
        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea placeholder="Notas personales..." rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar DVD'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
