import { useSyncExternalStore } from 'react'

/** Current window width; updates on window resize. */
export function useViewportWidth(): number {
  return useSyncExternalStore(
    (notify) => {
      window.addEventListener('resize', notify)
      return () => window.removeEventListener('resize', notify)
    },
    () => window.innerWidth,
    () => 0,
  )
}
