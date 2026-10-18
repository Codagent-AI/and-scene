import { useEffect, useState } from 'react'
import { TOC_MIN_VIEWPORT } from './constants'

export function useViewportWide(minWidth = TOC_MIN_VIEWPORT): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= minWidth)
  useEffect(() => {
    const update = () => setWide(window.innerWidth >= minWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [minWidth])
  return wide
}
