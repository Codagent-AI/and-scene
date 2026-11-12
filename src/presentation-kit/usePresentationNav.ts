import { useEffect, useState } from 'react'
import type { Mode } from './types'

const controls = 'button,a,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"]'
export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const jump = (n: number) => setIndex(Math.max(0, Math.min(count - 1, n)))
  useEffect(() => {
    const clamp = (n: number) => Math.max(0, Math.min(count - 1, n))
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof Element && event.target.closest(controls))) return
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); setIndex(n => clamp(n + 1)) }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); setIndex(n => clamp(n - 1)) }
      if (event.key.toLowerCase() === 'p') { event.preventDefault(); setMode(m => m === 'browse' ? 'present' : 'browse') }
    }
    let origin: { x: number; y: number } | undefined
    const start = (event: TouchEvent) => { const t = event.touches[0]; origin = t ? { x: t.clientX, y: t.clientY } : undefined }
    const end = (event: TouchEvent) => {
      const t = event.changedTouches[0]
      if (origin && t) {
        const dx = t.clientX - origin.x, dy = t.clientY - origin.y
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) setIndex(n => clamp(n + (dx < 0 ? 1 : -1)))
      }
      origin = undefined
    }
    const cancel = () => { origin = undefined }
    window.addEventListener('keydown', key)
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchend', end)
    window.addEventListener('touchcancel', cancel)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('touchstart', start)
      window.removeEventListener('touchend', end)
      window.removeEventListener('touchcancel', cancel)
    }
  }, [count])
  return { index: Math.min(index, Math.max(0, count - 1)), mode, jump, next: () => setIndex(n => Math.min(count - 1, n + 1)), prev: () => setIndex(n => Math.max(0, n - 1)), toggleMode: () => setMode(m => m === 'browse' ? 'present' : 'browse') }
}
