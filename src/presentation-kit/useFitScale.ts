import { useEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  mode: PresentationMode,
): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () => {
      const element = ref.current
      if (!element) return
      const layout = STAGE_LAYOUT[mode]
      const width = Math.max(0, element.clientWidth - layout.padding * 2)
      const height = Math.max(0, element.clientHeight - layout.header - layout.footer)
      setScale(Math.max(MIN_SCALE, Math.min(1, width / DESIGN_W, height / DESIGN_H)))
    }

    update()
    const observer = new ResizeObserver(update)
    if (ref.current) observer.observe(ref.current)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [mode, ref])

  return scale
}
