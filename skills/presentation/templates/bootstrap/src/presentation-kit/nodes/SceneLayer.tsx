import { AnimatePresence } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'

export interface SceneLayerProps extends Omit<ComponentProps<'div'>, 'style'> {
  style?: React.CSSProperties
  children?: ReactNode
}

/**
 * Absolutely positioned layer filling the canvas, so mounting one layer never
 * reflows another. Children that unmount (e.g. `Appear`) get exit animations.
 */
export function SceneLayer({ style, children, ...rest }: SceneLayerProps) {
  return (
    <div {...rest} data-presentation-layer style={{ position: 'absolute', inset: 0, ...style }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
