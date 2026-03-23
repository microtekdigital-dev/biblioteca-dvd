-- Create DVDs table for the DVD Library Manager
CREATE TABLE IF NOT EXISTS public.dvds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  titulo_original TEXT,
  año INTEGER,
  director TEXT,
  genero TEXT,
  duracion INTEGER, -- in minutes
  sinopsis TEXT,
  poster_url TEXT,
  tmdb_id INTEGER,
  ubicacion TEXT, -- physical location (e.g., "Estante A, Fila 2")
  formato TEXT DEFAULT 'DVD', -- DVD, Blu-ray, 4K, etc.
  estado TEXT DEFAULT 'disponible', -- disponible, prestado
  notas TEXT,
  calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  fecha_agregado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.dvds ENABLE ROW LEVEL SECURITY;

-- Create policies for DVDs table
CREATE POLICY "Users can view their own DVDs" 
  ON public.dvds FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DVDs" 
  ON public.dvds FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DVDs" 
  ON public.dvds FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DVDs" 
  ON public.dvds FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS dvds_user_id_idx ON public.dvds(user_id);
CREATE INDEX IF NOT EXISTS dvds_titulo_idx ON public.dvds(titulo);
CREATE INDEX IF NOT EXISTS dvds_genero_idx ON public.dvds(genero);
CREATE INDEX IF NOT EXISTS dvds_estado_idx ON public.dvds(estado);
