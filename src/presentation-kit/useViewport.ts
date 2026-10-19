import { useEffect, useState } from 'react'
import type { Size } from './fit.ts'

const read = (): Size => ({ width: window.innerWidth, height: window.innerHeight })

/** Current window size; one listener, removed on unmount (StrictMode-safe). */
export function useViewport(): Size {
  const [size, setSize] = useState(read)
  useEffect(() => {
    const onResize = () => setSize(read())
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}
