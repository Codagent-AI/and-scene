import type { HTMLAttributes } from 'react'
import { AnimatePresence } from 'motion/react'
import { DESIGN_H, DESIGN_W } from '../constants'

/**
 * Absolutely positions a step's diagram over the fixed canvas so that mounting one layer
 * never reflows another. Children that disappear animate out via AnimatePresence.
 */
export function SceneLayer({ children, style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-presentation-layer=""
      {...rest}
      style={{ position: 'absolute', left: 0, top: 0, width: DESIGN_W, height: DESIGN_H, ...style }}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
