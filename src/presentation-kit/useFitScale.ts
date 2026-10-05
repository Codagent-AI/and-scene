import { useEffect, useState } from 'react'

export function useFitScale(container: HTMLElement | null, width: number, height: number) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    if (!container) return
    const update = () => {
      const bounds = container.getBoundingClientRect()
      setScale(Math.max(0.05, Math.min(bounds.width / width, bounds.height / height)))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [container, width, height])
  return scale
}
