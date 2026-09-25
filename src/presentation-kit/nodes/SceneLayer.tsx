import type { PrimitiveProps } from '../types'
import { AnimatePresence } from 'motion/react'

export function SceneLayer({ className, children, style, ...props }: PrimitiveProps) {
  return <div className={['scene-layer', className].filter(Boolean).join(' ')} data-presentation-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}><AnimatePresence initial={false}>{children}</AnimatePresence></div>
}
