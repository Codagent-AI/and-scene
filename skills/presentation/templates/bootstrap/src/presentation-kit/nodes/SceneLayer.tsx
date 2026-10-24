import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Absolutely positioned layer holding one step's diagram, so mounting it
 * never reflows other content. Children keyed `Appear`s may enter and exit.
 */
export function SceneLayer({ children }: { children: ReactNode }) {
  return (
    <div data-presentation-layer="" style={{ position: 'absolute', inset: 0 }}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
