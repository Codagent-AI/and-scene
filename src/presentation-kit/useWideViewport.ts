import { useEffect, useState } from 'react'
import { WIDE_VIEWPORT_MIN } from './constants'

/** Whether the viewport is wide enough to show the table of contents. */
export function useWideViewport(): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= WIDE_VIEWPORT_MIN)
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= WIDE_VIEWPORT_MIN)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return wide
}
