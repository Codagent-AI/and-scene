import { useEffect, useState } from 'react'

const WIDE_VIEWPORT = 900

export function useWideViewport() {
  const [wide, setWide] = useState(() => window.innerWidth >= WIDE_VIEWPORT)

  useEffect(() => {
    const measure = () => setWide(window.innerWidth >= WIDE_VIEWPORT)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return wide
}
