import { useEffect, useState } from 'react'
import { WIDE_VIEWPORT_PX } from './constants'

const WIDE_QUERY = `(min-width: ${WIDE_VIEWPORT_PX}px)`

const read = () =>
  typeof window.matchMedia === 'function'
    ? window.matchMedia(WIDE_QUERY).matches
    : window.innerWidth >= WIDE_VIEWPORT_PX

/** True on wide viewports, read through matchMedia so the kit needs no CSS. */
export function useIsWide(): boolean {
  const [wide, setWide] = useState(read)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(WIDE_QUERY)
    const onChange = () => setWide(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return wide
}
