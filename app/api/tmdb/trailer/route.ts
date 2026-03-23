import { NextRequest, NextResponse } from 'next/server'

// GET /api/tmdb/trailer?tmdb_id=123 — obtiene el trailer de YouTube para una película
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tmdbId = searchParams.get('tmdb_id')

  if (!tmdbId) {
    return NextResponse.json({ error: 'tmdb_id requerido' }, { status: 400 })
  }

  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB_API_KEY no configurada' }, { status: 500 })
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${apiKey}&language=es-ES`
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Error al consultar TMDB' }, { status: 502 })
  }

  const data = await res.json()

  // Buscar trailer oficial en español, si no hay buscar en inglés
  const videos = data.results ?? []
  const trailer =
    videos.find((v: { type: string; site: string; official: boolean; iso_639_1: string }) =>
      v.type === 'Trailer' && v.site === 'YouTube' && v.official && v.iso_639_1 === 'es'
    ) ??
    videos.find((v: { type: string; site: string }) =>
      v.type === 'Trailer' && v.site === 'YouTube'
    ) ??
    videos.find((v: { site: string }) => v.site === 'YouTube')

  if (!trailer) {
    return NextResponse.json({ youtubeKey: null })
  }

  return NextResponse.json({ youtubeKey: trailer.key })
}
