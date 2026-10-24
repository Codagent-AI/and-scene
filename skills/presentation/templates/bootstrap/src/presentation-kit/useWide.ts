import { useEffect, useState } from 'react'
import { WIDE_BREAKPOINT } from './constants'

export function useWide(): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= WIDE_BREAKPOINT)
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= WIDE_BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return wide
}
