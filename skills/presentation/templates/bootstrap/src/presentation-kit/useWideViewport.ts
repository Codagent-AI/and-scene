import { useSyncExternalStore } from 'react'
import { TOC_BREAKPOINT } from './constants'

export function isWideViewport(width: number): boolean {
  return width >= TOC_BREAKPOINT
}

function subscribe(notify: () => void) {
  window.addEventListener('resize', notify)
  return () => window.removeEventListener('resize', notify)
}

export function useWideViewport(): boolean {
  return useSyncExternalStore(subscribe, () => isWideViewport(window.innerWidth))
}
