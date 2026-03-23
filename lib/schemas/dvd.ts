import { z } from 'zod'

export const dvdSchema = z.object({
  numero: z.number({ invalid_type_error: 'El número debe ser un entero positivo' })
    .int('El número debe ser un entero')
    .positive('El número debe ser mayor a cero'),
  titulo: z.string().min(1, 'El título es obligatorio'),
  titulo_original: z.string().optional(),
  año: z.number().int().min(1888).max(new Date().getFullYear() + 2).optional(),
  director: z.string().optional(),
  genero: z.string().optional(),
  duracion: z.number().int().positive().optional(),
  sinopsis: z.string().optional(),
  poster_url: z.string().optional(),
  tmdb_id: z.string().optional(),
  ubicacion: z.string().optional(),
  formato: z.enum(['DVD', 'Blu-ray', '4K']).default('DVD'),
  estado: z.enum(['disponible', 'prestado']).default('disponible'),
  notas: z.string().optional(),
  calificacion: z.number().int().min(1).max(5).optional(),
})

export type DvdFormValues = z.infer<typeof dvdSchema>
