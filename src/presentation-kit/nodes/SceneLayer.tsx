import type { ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

/**
 * Absolutely positioned layer for one diagram. Children keyed by entity id
 * animate out when they stop being rendered.
 */
export function SceneLayer({ children }: { children?: ReactNode }) {
  return (
    <div data-presentation-layer="" style={{ position: 'absolute', inset: 0 }}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
