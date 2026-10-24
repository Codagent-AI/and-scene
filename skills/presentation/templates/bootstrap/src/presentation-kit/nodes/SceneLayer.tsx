import { AnimatePresence } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Absolutely positioned layer holding one step's diagram, so mounting it
 * never reflows other content. Children keyed `Appear`s may enter and exit.
 */
export function SceneLayer({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div data-presentation-layer="" className={className} style={{ position: 'absolute', inset: 0, ...style }}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
