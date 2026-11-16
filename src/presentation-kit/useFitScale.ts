import { useEffect, useRef, useState } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'

export function fitScale(width: number, height: number, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  return Math.max(0, Math.min(width / designWidth, height / designHeight))
}
export function useWideViewport() {
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1100px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1100px)')
    const update = () => setWide(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return wide
}
export function useFitScale(width = DESIGN_W, height = DESIGN_H) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => setScale(fitScale(node.clientWidth, node.clientHeight, width, height))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [width, height])
  return { ref, scale }
}
