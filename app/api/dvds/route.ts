import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/dvds — lista DVDs del usuario ordenados por numero ASC
// Acepta ?search= para filtrar por titulo, director, genero o numero
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()

  let query = supabase
    .from('dvds')
    .select('*')
    .eq('user_id', user.id)
    .order('numero', { ascending: true })

  if (search) {
    // Si el search es numérico, también busca por numero exacto
    const numSearch = parseInt(search, 10)
    if (!isNaN(numSearch)) {
      query = query.or(`titulo.ilike.%${search}%,director.ilike.%${search}%,genero.ilike.%${search}%,numero.eq.${numSearch}`)
    } else {
      query = query.or(`titulo.ilike.%${search}%,director.ilike.%${search}%,genero.ilike.%${search}%`)
    }
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/dvds — crea un nuevo DVD
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()

  // Si no se provee numero, calcular MAX(numero)+1
  let numero = body.numero
  if (!numero) {
    const { data: maxData } = await supabase
      .from('dvds')
      .select('numero')
      .eq('user_id', user.id)
      .order('numero', { ascending: false })
      .limit(1)
      .single()

    numero = maxData ? maxData.numero + 1 : 1
  }

  const { data, error } = await supabase
    .from('dvds')
    .insert({ ...body, numero, user_id: user.id })
    .select()
    .single()

  if (error) {
    // Violación de constraint UNIQUE (numero duplicado)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Este número ya está en uso en tu colección' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
