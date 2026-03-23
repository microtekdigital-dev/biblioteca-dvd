-- Migration: Add numero field to dvds table
-- Requisitos: 1.1, 1.3, 1.5

-- Step 1: Add nullable column first (to allow data migration)
ALTER TABLE public.dvds
ADD COLUMN IF NOT EXISTS numero INTEGER;

-- Step 2: Add unique constraint per user
ALTER TABLE public.dvds
DROP CONSTRAINT IF EXISTS dvds_numero_user_unique;

ALTER TABLE public.dvds
ADD CONSTRAINT dvds_numero_user_unique UNIQUE (user_id, numero);

-- Step 3: Create function to get next available numero for a user
CREATE OR REPLACE FUNCTION public.get_next_dvd_numero(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(MAX(numero), 0) + 1
  FROM public.dvds
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Step 4: Migrate existing records — assign sequential numbers ordered by fecha_agregado
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY fecha_agregado ASC) AS rn
  FROM public.dvds
  WHERE numero IS NULL
)
UPDATE public.dvds
SET numero = numbered.rn
FROM numbered
WHERE public.dvds.id = numbered.id;

-- Step 5: Make column NOT NULL after data migration
ALTER TABLE public.dvds ALTER COLUMN numero SET NOT NULL;

-- Step 6: Add index for performance on numero queries
CREATE INDEX IF NOT EXISTS dvds_numero_idx ON public.dvds (user_id, numero);
