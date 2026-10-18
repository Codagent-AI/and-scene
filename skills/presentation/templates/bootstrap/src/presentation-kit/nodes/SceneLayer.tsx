import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

interface SceneLayerProps {
  children: ReactNode
  z?: number
}

/**
 * Absolutely positions a diagram layer over the canvas so mounting one layer never
 * reflows another. Keyed `Appear` children get exit animations.
 */
export function SceneLayer({ children, z }: SceneLayerProps) {
  return (
    <div
      data-presentation-scene-layer=""
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: z }}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
