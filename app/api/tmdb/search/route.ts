import { NextRequest, NextResponse } from 'next/server'

// Caché en memoria de géneros (se rellena una vez por proceso)
let genreMap: Record<number, string> | null = null

async function getGenreMap(apiKey: string): Promise<Record<number, string>> {
  if (genreMap) return genreMap
  const res = await fetch(
    `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=es-ES`
  )
  if (!res.ok) return {}
  const data = await res.json()
  genreMap = Object.fromEntries(
    (data.genres ?? []).map((g: { id: number; name: string }) => [g.id, g.name])
  )
  return genreMap
}

// GET /api/tmdb/search?q=titulo — busca películas en TMDB
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) return NextResponse.json([])

  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB_API_KEY no configurada' }, { status: 500 })
  }

  const [searchRes, genres] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(q)}&language=es-ES&page=1`),
    getGenreMap(apiKey),
  ])

  if (!searchRes.ok) {
    return NextResponse.json({ error: 'Error al consultar TMDB' }, { status: 502 })
  }

  const data = await searchRes.json()
  const movies = ((data.results ?? []).slice(0, 8)) as {
    id: number
    title: string
    original_title: string
    release_date?: string
    genre_ids?: number[]
    overview?: string
    poster_path?: string
  }[]

  // Obtener créditos de todas las películas en paralelo para extraer el director
  const creditsResults = await Promise.all(
    movies.map((m) =>
      fetch(`https://api.themoviedb.org/3/movie/${m.id}/credits?api_key=${apiKey}`)
        .then((r) => (r.ok ? r.json() : { crew: [] }))
        .catch(() => ({ crew: [] }))
    )
  )

  const results = movies.map((m, i) => {
    const crew: { job: string; name: string }[] = creditsResults[i]?.crew ?? []
    const director = crew.find((c) => c.job === 'Director')?.name ?? ''
    return {
      tmdb_id: String(m.id),
      titulo: m.title,
      titulo_original: m.original_title,
      año: m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : undefined,
      genero: (m.genre_ids ?? []).map((id) => genres[id]).filter(Boolean).join(', '),
      director,
      sinopsis: m.overview ?? '',
      poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
    }
  })

  return NextResponse.json(results)
}
