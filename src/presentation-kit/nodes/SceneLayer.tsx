import { AnimatePresence } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function SceneLayer({ children, className = '', style, ...props }: { children: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: string | undefined }) {
  return <div className={`scene-layer ${className}`.trim()} data-presentation-layer style={{ position: 'absolute', inset: 0, ...style }} {...props}><AnimatePresence mode="sync">{children}</AnimatePresence></div>
}
