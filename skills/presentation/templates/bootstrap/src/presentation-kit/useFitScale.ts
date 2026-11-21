import { useEffect, useRef, useState } from 'react'

export function fitScale(width: number, height: number, designWidth: number, designHeight: number) {
  return Math.max(0, Math.min(width / designWidth, height / designHeight))
}

export function useFitScale(designWidth: number, designHeight: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, scale: fitScale(size.width, size.height, designWidth, designHeight) }
}
