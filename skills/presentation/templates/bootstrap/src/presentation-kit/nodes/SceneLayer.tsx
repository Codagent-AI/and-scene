import { AnimatePresence } from 'motion/react'
import type { ComponentProps } from 'react'

export function SceneLayer({ children, style, ...props }: ComponentProps<'div'>) {
  return <div {...props} data-presentation-layer="" style={{ position: 'absolute', inset: 0, ...style }}>
    <AnimatePresence>{children}</AnimatePresence>
  </div>
}
