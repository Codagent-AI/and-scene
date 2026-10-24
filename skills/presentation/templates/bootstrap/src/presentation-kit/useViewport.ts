import { useEffect, useState } from 'react'

export interface Viewport {
  width: number
  height: number
}

const read = (): Viewport => ({ width: window.innerWidth, height: window.innerHeight })

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState(read)
  useEffect(() => {
    const onResize = () => setViewport(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return viewport
}
