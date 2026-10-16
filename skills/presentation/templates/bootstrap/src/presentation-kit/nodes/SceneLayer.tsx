import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Absolutely positions one step's diagram over the canvas so mounting a layer
 * never reflows another, and lets keyed children (e.g. Appear) animate out.
 */
export function SceneLayer({ children }: { children: ReactNode }) {
  return (
    <div data-presentation-layer="" style={{ position: 'absolute', inset: 0 }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
