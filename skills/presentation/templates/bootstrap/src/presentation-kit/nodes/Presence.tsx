import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Lets keyed entities that leave a grouped scene animate out. Render each entity (or its
 * `Appear` wrapper) as a direct, keyed child; entities already present on mount skip entry.
 */
export function Presence({ children }: { children?: ReactNode }) {
  return <AnimatePresence initial={false}>{children}</AnimatePresence>
}
