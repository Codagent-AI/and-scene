import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
export function SceneLayer({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={['scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer style={style}><AnimatePresence mode="popLayout">{children}</AnimatePresence></div>
}
