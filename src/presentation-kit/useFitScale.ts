import { useEffect, useState } from 'react'
import { getFitScale } from './utils'

export function useFitScale(ref: { current: HTMLElement | null }, width = 880, height = 380): number {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setScale(getFitScale(element.clientWidth, element.clientHeight, width, height))
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, width, height])
  return scale
}
