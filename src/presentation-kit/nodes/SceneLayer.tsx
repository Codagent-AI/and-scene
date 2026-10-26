import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

interface SceneLayerProps { children: ReactNode; className?: string; style?: CSSProperties }

export function SceneLayer({ children, className, style }: SceneLayerProps) {
  return <div data-presentation-scene-layer className={className} style={{ inset: 0, position: 'absolute', ...style }}><AnimatePresence>{children}</AnimatePresence></div>
}
