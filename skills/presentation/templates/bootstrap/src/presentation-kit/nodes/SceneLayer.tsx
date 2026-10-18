import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

/**
 * Absolutely positions one diagram over the canvas so mounting a layer never reflows another.
 * Direct children must carry stable `key`s: removed children play their exit animation.
 */
export function SceneLayer({
  children,
  className,
  style,
}: {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
      data-presentation-scene-layer=""
    >
      <AnimatePresence initial>{children}</AnimatePresence>
    </div>
  )
}
