import type { ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

/**
 * Absolutely positioned layer for a step's diagram. Entities are direct keyed
 * children, so departing entities stay mounted until their exit completes.
 */
export function SceneLayer({ children }: { children?: ReactNode }) {
  return (
    <div data-presentation-layer="" style={{ position: 'absolute', inset: 0 }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
