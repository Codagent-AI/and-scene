import { useEffect, useState } from 'react'

const DEFAULT_WIDE_BREAKPOINT_PX = 880

/** Structural (not visual) viewport-width check used to gate wide-only chrome, e.g. the table of contents. */
export function useIsWideViewport(breakpointPx: number = DEFAULT_WIDE_BREAKPOINT_PX): boolean {
  const [isWide, setIsWide] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= breakpointPx,
  )

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${breakpointPx}px)`)
    const onChange = () => setIsWide(query.matches)
    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [breakpointPx])

  return isWide
}
