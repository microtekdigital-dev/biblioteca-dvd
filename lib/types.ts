export interface Dvd {
  id: string;
  user_id: string;
  numero: number;
  titulo: string;
  titulo_original?: string;
  año: number;
  director?: string;
  genero?: string;
  duracion?: number;
  sinopsis?: string;
  poster_url?: string;
  tmdb_id?: string;
  ubicacion?: string;
  formato: 'DVD' | 'Blu-ray' | '4K';
  estado: 'disponible' | 'prestado';
  notas?: string;
  calificacion?: number;
  fecha_agregado: string;
  created_at?: string;
  updated_at?: string;
}
