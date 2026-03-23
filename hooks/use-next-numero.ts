import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useNextNumero() {
  const { data, isLoading, error } = useSWR<{ nextNumero: number }>(
    '/api/dvds/next-numero',
    fetcher
  )

  return {
    nextNumero: data?.nextNumero ?? null,
    isLoading,
    error,
  }
}
