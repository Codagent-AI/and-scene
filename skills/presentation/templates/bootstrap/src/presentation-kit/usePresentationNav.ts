import { useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'

const forward = new Set(['ArrowRight', ' ', 'PageDown'])
const back = new Set(['ArrowLeft', 'PageUp'])
const controls = [
  'a[href]', 'button', 'input', 'select', 'textarea', 'summary', 'audio[controls]', 'video[controls]',
  '[contenteditable]:not([contenteditable="false"])', '[tabindex]:not([tabindex="-1"])',
  ...['button', 'checkbox', 'combobox', 'listbox', 'menuitem', 'option', 'radio', 'slider', 'spinbutton',
    'switch', 'tab', 'textbox'].map(role => `[role="${role}"]`),
].join(',')
const SWIPE_THRESHOLD = 45

export function usePresentationNav(count: number, initialMode: Mode) {
  const last = Math.max(0, count - 1)
  const clamp = (index: number) => Math.max(0, Math.min(last, index))
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const start = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof Element && event.target.closest(controls)) return
      if (event.key.toLowerCase() === 'p' && !event.repeat) {
        setMode(current => current === 'browse' ? 'present' : 'browse')
      } else if (forward.has(event.key) || back.has(event.key)) {
        event.preventDefault()
        const delta = forward.has(event.key) ? 1 : -1
        setIndex(current => Math.max(0, Math.min(last, Math.min(current, last) + delta)))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  function move(delta: number) {
    setIndex(current => clamp(clamp(current) + delta))
  }

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    start.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
  }

  function onTouchEnd(event: TouchEvent) {
    const origin = start.current
    start.current = null
    const touch = event.changedTouches[0]
    if (!origin || !touch) return

    const dx = touch.clientX - origin.x
    const dy = touch.clientY - origin.y
    if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      move(dx < 0 ? 1 : -1)
    }
  }

  return {
    index: clamp(index),
    mode,
    next: () => move(1),
    previous: () => move(-1),
    jump: (target: number) => setIndex(clamp(target)),
    touch: { onTouchStart, onTouchEnd, onTouchCancel: () => { start.current = null } },
  }
}
