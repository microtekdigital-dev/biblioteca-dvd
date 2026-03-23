import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/dvds/next-numero — retorna el siguiente numero disponible para el usuario
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('dvds')
    .select('numero')
    .eq('user_id', user.id)
    .order('numero', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (colección vacía)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const nextNumero = data ? data.numero + 1 : 1

  return NextResponse.json({ nextNumero })
}
