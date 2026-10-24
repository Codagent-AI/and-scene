import { AnimatePresence } from 'motion/react'
import type { HTMLAttributes } from 'react'

export type SceneLayerProps = HTMLAttributes<HTMLDivElement>

/**
 * Absolutely positions one layer of a step's diagram so mounting it never
 * reflows another, and lets keyed children play exit animations when they leave.
 */
export function SceneLayer({ children, style, ...rest }: SceneLayerProps) {
  return (
    <div
      data-presentation-scene-layer=""
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', ...style }}
      {...rest}
    >
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
