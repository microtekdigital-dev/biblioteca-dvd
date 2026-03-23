-- Create Prestamos (Loans) table
CREATE TABLE IF NOT EXISTS public.prestamos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dvd_id UUID NOT NULL REFERENCES public.dvds(id) ON DELETE CASCADE,
  prestado_a TEXT NOT NULL, -- name of the person
  fecha_prestamo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_devolucion_esperada TIMESTAMP WITH TIME ZONE,
  fecha_devolucion_real TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  estado TEXT DEFAULT 'activo', -- activo, devuelto
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;

-- Create policies for Prestamos table
CREATE POLICY "Users can view their own loans" 
  ON public.prestamos FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loans" 
  ON public.prestamos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans" 
  ON public.prestamos FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans" 
  ON public.prestamos FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS prestamos_user_id_idx ON public.prestamos(user_id);
CREATE INDEX IF NOT EXISTS prestamos_dvd_id_idx ON public.prestamos(dvd_id);
CREATE INDEX IF NOT EXISTS prestamos_estado_idx ON public.prestamos(estado);

-- Create function to update DVD status when loan is created/updated
CREATE OR REPLACE FUNCTION update_dvd_status_on_loan()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.dvds SET estado = 'prestado', updated_at = NOW() WHERE id = NEW.dvd_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.estado = 'devuelto' AND OLD.estado = 'activo' THEN
    UPDATE public.dvds SET estado = 'disponible', updated_at = NOW() WHERE id = NEW.dvd_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for loan status changes
DROP TRIGGER IF EXISTS on_loan_change ON public.prestamos;
CREATE TRIGGER on_loan_change
  AFTER INSERT OR UPDATE ON public.prestamos
  FOR EACH ROW
  EXECUTE FUNCTION update_dvd_status_on_loan();
