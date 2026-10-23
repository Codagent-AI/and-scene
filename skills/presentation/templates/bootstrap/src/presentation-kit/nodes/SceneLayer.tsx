import type { ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

/**
 * Absolutely positioned layer for a step's diagram, so mounting one layer never
 * reflows another. Children that leave the tree animate out.
 */
export function SceneLayer({ children }: { children?: ReactNode }) {
  return (
    <div data-presentation-layer="" style={{ position: 'absolute', inset: 0 }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
