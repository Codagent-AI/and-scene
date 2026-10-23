import { AnimatePresence } from 'motion/react'
import type { HTMLAttributes } from 'react'

const LAYER = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' } as const

/**
 * Absolutely positioned diagram layer, so mounting one layer never reflows another.
 * Keyed children that leave the layer play their `exit` animation.
 */
export function SceneLayer({ style, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} data-presentation-scene-layer style={{ ...LAYER, ...style }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
