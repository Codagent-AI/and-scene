import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Mode } from './types'

export function clampStep(index: number, count: number) {
  return Math.max(0, Math.min(index, count - 1))
}

export function keyAction(key: string) {
  switch (key.toLowerCase()) {
    case 'arrowright':
    case ' ':
    case 'pagedown':
      return 'next'
    case 'arrowleft':
    case 'pageup':
      return 'previous'
    case 'p':
      return 'mode'
  }
}

export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(
    'a[href], button, input, select, textarea, summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="textbox"], [role="slider"], [role="tab"], [role="checkbox"], [role="menuitem"], [tabindex]',
  ))
}

export function swipeDelta(dx: number, dy: number) {
  return Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : -1) : 0
}

export function usePresentationNav(count: number, initialMode: Mode) {
  const [requestedIndex, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const index = clampStep(requestedIndex, count)
  const start = useRef<{ id: number; x: number; y: number } | null>(null)
  const go = (target: number) => setIndex(clampStep(target, count))
  const move = useCallback((delta: number) => {
    setIndex(current => clampStep(clampStep(current, count) + delta, count))
  }, [count])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isInteractive(event.target)) return
      const action = keyAction(event.key)
      if (!action) return
      event.preventDefault()
      if (action === 'mode') {
        if (!event.repeat) setMode(current => current === 'browse' ? 'present' : 'browse')
      } else {
        move(action === 'next' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [move])

  return {
    index, mode, go,
    previous: () => move(-1),
    next: () => move(1),
    touch: {
      onTouchStart(event: TouchEvent) {
        const touch = event.touches[0]
        start.current = event.touches.length === 1 && !isInteractive(event.target)
          ? { id: touch.identifier, x: touch.clientX, y: touch.clientY }
          : null
      },
      onTouchEnd(event: TouchEvent) {
        const origin = start.current
        start.current = null
        if (!origin) return
        const touch = Array.from(event.changedTouches).find(item => item.identifier === origin.id)
        if (!touch) return
        const delta = swipeDelta(touch.clientX - origin.x, touch.clientY - origin.y)
        if (delta) move(delta)
      },
      onTouchCancel() {
        start.current = null
      },
    },
  }
}
