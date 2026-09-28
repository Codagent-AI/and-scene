import { useEffect, useState } from 'react'
import { TOC_MIN_WIDTH } from './constants'

const QUERY = `(min-width: ${TOC_MIN_WIDTH}px)`

export function useWideViewport(): boolean {
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  const [wide, setWide] = useState(() => (supported ? window.matchMedia(QUERY).matches : true))
  useEffect(() => {
    if (!supported) return
    const mq = window.matchMedia(QUERY)
    const onChange = () => setWide(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [supported])
  return wide
}
