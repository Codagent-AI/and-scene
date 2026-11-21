import { Children } from 'react'
import type { ComponentProps } from 'react'
import { AnimatePresence } from 'motion/react'

export function SceneLayer({ children, style, ...props }: ComponentProps<'div'>) {
  return <div data-presentation-layer="" style={{ ...style, position: 'absolute', inset: 0 }} {...props}>
    <AnimatePresence propagate>{Children.toArray(children)}</AnimatePresence>
  </div>
}
