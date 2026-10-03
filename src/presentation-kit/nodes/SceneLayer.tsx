import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

export function SceneLayer({ children, className, style, ...props }: { children: ReactNode; className?: string; style?: CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={['presentation-scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }}><AnimatePresence mode="sync">{children}</AnimatePresence></div>
}
