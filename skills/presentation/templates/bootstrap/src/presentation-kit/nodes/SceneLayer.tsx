import type { ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

/**
 * Absolutely positions one step's diagram over the whole canvas so mounting a
 * layer never reflows another. Keyed children that leave the layer animate out.
 */
export function SceneLayer({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      data-presentation-layer=""
      className={className}
      style={{ position: 'absolute', inset: 0 }}
    >
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
