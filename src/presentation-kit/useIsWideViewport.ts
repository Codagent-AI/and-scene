import { useEffect, useState } from 'react'

const DEFAULT_MIN_WIDTH = 768

/** Behavioral viewport check gating the table of contents to wide viewports. */
export function useIsWideViewport(minWidth: number = DEFAULT_MIN_WIDTH): boolean {
  const [isWide, setIsWide] = useState(() => window.innerWidth >= minWidth)

  useEffect(() => {
    function handleResize() {
      setIsWide(window.innerWidth >= minWidth)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [minWidth])

  return isWide
}
