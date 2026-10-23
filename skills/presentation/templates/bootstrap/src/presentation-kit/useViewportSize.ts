import { useEffect, useState } from 'react'

export interface ViewportSize {
  width: number
  height: number
}

function read(): ViewportSize {
  return { width: window.innerWidth, height: window.innerHeight }
}

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState(read)
  useEffect(() => {
    const onResize = () => setSize(read())
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}
