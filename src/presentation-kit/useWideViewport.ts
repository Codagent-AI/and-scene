import { useEffect, useState } from 'react'
import { WIDE_VIEWPORT_MIN } from './constants'

/** True at or above the wide-viewport breakpoint. Follows window resizes. */
export function useWideViewport(): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= WIDE_VIEWPORT_MIN)
  useEffect(() => {
    const update = () => setWide(window.innerWidth >= WIDE_VIEWPORT_MIN)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return wide
}
