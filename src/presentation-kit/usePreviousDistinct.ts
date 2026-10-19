import { useState } from 'react'

/** The value held before the latest change of `value` (undefined until it first changes). */
export function usePreviousDistinct<T>(value: T): T | undefined {
  const [tracked, setTracked] = useState<{ current: T; previous: T | undefined }>({
    current: value,
    previous: undefined,
  })
  if (tracked.current !== value) setTracked({ current: value, previous: tracked.current })
  return tracked.current === value ? tracked.previous : tracked.current
}
