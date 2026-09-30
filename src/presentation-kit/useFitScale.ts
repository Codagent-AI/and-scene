import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, fitScale } from './constants'

export function useFitScale() {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!container) return

    const update = () => {
      const { width, height } = container.getBoundingClientRect()
      setScale(fitScale({ width: width || DESIGN_W, height: height || DESIGN_H }))
    }

    update()
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [container])

  return { scale, setContainer }
}
