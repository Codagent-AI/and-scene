import { useEffect, useState } from 'react'
import { WIDE_VIEWPORT } from './constants'

const QUERY = `(min-width: ${WIDE_VIEWPORT}px)`

function readWide(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : window.innerWidth >= WIDE_VIEWPORT
}

/** True when the viewport is wide enough to show the table of contents. */
export function useIsWide(): boolean {
  const [wide, setWide] = useState(readWide)
  useEffect(() => {
    const update = () => setWide(readWide())
    window.addEventListener('resize', update)
    const query = typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null
    query?.addEventListener?.('change', update)
    return () => {
      window.removeEventListener('resize', update)
      query?.removeEventListener?.('change', update)
    }
  }, [])
  return wide
}
