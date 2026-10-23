import { useEffect, useState } from 'react'

/** Mounted entity instances per id, counting scenes that are still animating out. */
const mounted = new Map<string, number>()

/**
 * True when an entity with this id was already mounted before this instance first rendered, which
 * means the previous scene still holds it while it exits. Such an entity is a continuing one: it
 * should morph out of the old geometry, not wait hidden for persisting entities to settle.
 */
export function useContinuesFromPrevious(id: string): boolean {
  const [continues] = useState(() => (mounted.get(id) ?? 0) > 0)
  useEffect(() => {
    mounted.set(id, (mounted.get(id) ?? 0) + 1)
    return () => {
      const left = (mounted.get(id) ?? 1) - 1
      if (left > 0) mounted.set(id, left)
      else mounted.delete(id)
    }
  }, [id])
  return continues
}
