import { AnimatePresence } from 'motion/react'
import type { ComponentProps } from 'react'

export function SceneLayer({ children, style, ...props }: ComponentProps<'div'>) {
  return (
    <div data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}>
      <AnimatePresence propagate>{children}</AnimatePresence>
    </div>
  )
}
