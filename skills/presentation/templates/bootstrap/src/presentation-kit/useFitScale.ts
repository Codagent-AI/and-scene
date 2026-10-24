import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import { fitScale } from './fitScale'
import type { Mode } from './types'

/** Uniform scale fitting the design canvas into the referenced stage region. */
export function useFitScale(region: RefObject<HTMLElement | null>, mode: Mode): number {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = region.current
    if (!el) return
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = el
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [region])

  return fitScale(size, mode)
}
