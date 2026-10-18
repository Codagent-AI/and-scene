import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

export interface SceneLayerProps {
  className?: string
  style?: CSSProperties
  /** Keyed entities. Children removed from this list animate out. */
  children?: ReactNode
}

/**
 * Absolutely positions one diagram layer over the whole design canvas so mounting
 * a layer never reflows another. Its direct, keyed children may enter and exit.
 */
export function SceneLayer({ className, style, children }: SceneLayerProps) {
  return (
    <div
      data-presentation-scene-layer=""
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', ...style }}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
