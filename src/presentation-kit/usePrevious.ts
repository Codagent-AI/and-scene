import { useState } from 'react'

/**
 * The value from before the latest change of `value` (or `initial` before any change).
 * It stays stable across re-renders that do not change `value`, so a scene can tell which
 * entities were introduced by the current transition for as long as the step is shown.
 */
export function usePrevious<T>(value: T, initial: T): T {
  const [tracked, setTracked] = useState({ current: value, previous: initial })
  if (tracked.current !== value) {
    setTracked({ current: value, previous: tracked.current })
    return tracked.current
  }
  return tracked.previous
}
