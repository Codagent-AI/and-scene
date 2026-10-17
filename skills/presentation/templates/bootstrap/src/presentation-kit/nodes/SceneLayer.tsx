import { AnimatePresence } from 'motion/react'
import type { HTMLAttributes, ReactNode } from 'react'

interface SceneLayerProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

/**
 * Absolutely positioned layer of a step's diagram, so mounting one layer never
 * reflows another. Hosts departing `Appear` children so they can animate out.
 */
export function SceneLayer({ children, style, ...rest }: SceneLayerProps) {
  return (
    <div {...rest} data-presentation-layer style={{ position: 'absolute', inset: 0, ...style }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
