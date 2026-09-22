import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
export function SceneLayer({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={className} style={{ position: 'absolute', inset: 0, ...style }} data-presentation-scene-layer=""><AnimatePresence initial={false}>{children}</AnimatePresence></div>
}
