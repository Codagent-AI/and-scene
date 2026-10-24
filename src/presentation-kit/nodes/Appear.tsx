import type { ReactNode } from 'react'
import { AppearContext } from './appearMotion'

/**
 * Marks the entities rendered inside as newcomers: they fade in only after
 * persisting entities have finished moving. Renders no DOM of its own.
 * Pass `active={false}` once an entity continues, so it keeps the same React
 * position (and morphs through layout projection) but gets no enter motion.
 */
export function Appear({
  active = true,
  delay = 0,
  children,
}: {
  active?: boolean
  /** Extra seconds after the settle delay, to sequence newcomers among themselves. */
  delay?: number
  children: ReactNode
}) {
  return <AppearContext.Provider value={active ? { delay } : null}>{children}</AppearContext.Provider>
}
