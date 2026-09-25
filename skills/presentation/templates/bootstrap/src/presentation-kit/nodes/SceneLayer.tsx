import { AnimatePresence } from 'motion/react'
import type { NodeProps } from '../types'
export function SceneLayer({ children, className = '', style, ...props }: NodeProps) {
  return <div className={`scene-layer ${className}`.trim()} data-presentation-layer style={{ position: 'absolute', inset: 0, ...style }} {...props}><AnimatePresence mode="sync">{children}</AnimatePresence></div>
}
