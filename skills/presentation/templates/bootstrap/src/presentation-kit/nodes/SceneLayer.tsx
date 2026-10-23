import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Absolutely positioned diagram layer. Mounting or unmounting one layer does
 * not reflow another. Keyed children that leave the layer play their exit.
 */
export function SceneLayer({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <div data-presentation-layer={name} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
