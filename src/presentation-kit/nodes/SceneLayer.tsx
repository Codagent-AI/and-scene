import type { ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

/**
 * Absolutely positioned container for one step's diagram, so mounting a layer
 * never reflows another. Children must be keyed nodes so departures can exit.
 */
export function SceneLayer({ children }: { children?: ReactNode }) {
  return (
    <div data-presentation-layer="" style={{ position: 'absolute', inset: 0 }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
