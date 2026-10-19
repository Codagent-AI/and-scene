import { createContext, useContext, useEffect, useState } from 'react'
import { ENTER_DELAY, ENTER_T, EASE } from './constants'

/** Tracks which entity ids are currently mounted within a Stage. */
export class EntityRegistry {
  private counts = new Map<string, number>()
  has(id: string) {
    return (this.counts.get(id) ?? 0) > 0
  }
  get size() {
    return this.counts.size
  }
  add(id: string) {
    this.counts.set(id, (this.counts.get(id) ?? 0) + 1)
  }
  remove(id: string) {
    const n = (this.counts.get(id) ?? 0) - 1
    if (n > 0) this.counts.set(id, n)
    else this.counts.delete(id)
  }
}

export const EntityRegistryContext = createContext<EntityRegistry | null>(null)

export interface EntranceProps {
  initial: false | { opacity: number }
  animate: { opacity: number; transition: { delay: number; duration: number; ease: typeof EASE } }
  exit: { opacity: number; transition: { duration: number; ease: typeof EASE } }
}

/** Motion props for an entity: newcomers fade in after persisting entities settle. */
export function buildEntrance(continuing: boolean, othersPresent: boolean): EntranceProps {
  return {
    initial: continuing ? false : { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        delay: !continuing && othersPresent ? ENTER_DELAY : 0,
        duration: ENTER_T,
        ease: EASE,
      },
    },
    exit: { opacity: 0, transition: { duration: ENTER_T, ease: EASE } },
  }
}

/**
 * Entrance props decided once, on first mount of this id. An id already
 * mounted elsewhere in the stage (the outgoing scene) is continuing and gets
 * no newcomer fade; payload updates never replay the entrance.
 */
export function useEntrance(id: string): EntranceProps {
  const registry = useContext(EntityRegistryContext)
  const [entrance] = useState(() =>
    buildEntrance(registry?.has(id) ?? false, (registry?.size ?? 0) > 0),
  )
  useEffect(() => {
    registry?.add(id)
    return () => registry?.remove(id)
  }, [registry, id])
  return entrance
}
