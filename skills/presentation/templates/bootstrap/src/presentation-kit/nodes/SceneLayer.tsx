import { AnimatePresence } from 'motion/react'
import type { HTMLAttributes, ReactNode } from 'react'

export type SceneLayerProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  name: string
  children?: ReactNode
}

/**
 * Absolutely positioned diagram layer. Mounting or unmounting one layer does
 * not reflow another. Keyed children that leave the layer play their exit.
 */
export function SceneLayer({ name, children, style, ...rest }: SceneLayerProps) {
  return (
    <div
      data-presentation-layer={name}
      {...rest}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', ...style }}
    >
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
