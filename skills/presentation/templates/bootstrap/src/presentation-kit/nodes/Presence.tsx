import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Wrap conditionally rendered entities (each with a stable `key`) so they animate out when a
 * step no longer includes them. Entities present on first render do not animate in.
 */
export function Presence({ children }: { children: ReactNode }) {
  return <AnimatePresence initial={false}>{children}</AnimatePresence>
}
