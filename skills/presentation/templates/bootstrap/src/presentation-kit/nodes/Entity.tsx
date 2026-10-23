import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { LAYOUT_TRANSITION, presenceProps } from '../motion'

export interface EntityProps extends Omit<HTMLMotionProps<'div'>, 'layoutId' | 'id' | 'children'> {
  children?: ReactNode
  /** Stable identity: becomes the layoutId so the entity morphs across steps. */
  id: string
  x?: number
  y?: number
  width?: number
  height?: number
  /** Primitive kind, exposed as `data-presentation-kind`. */
  kind?: string
  emphasis?: boolean | string
  /** Newcomer: fade in after persisting entities settle (a number adds extra delay). Omit for continuing entities. */
  appear?: boolean | number
}

/** Base entity: an absolutely positioned motion element with a stable layoutId. */
export function Entity({ id, x, y, width, height, kind = 'entity', emphasis, appear, style, children, ...rest }: EntityProps) {
  const placed = x !== undefined || y !== undefined
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      {...presenceProps(appear)}
      data-presentation-entity={id}
      data-presentation-kind={kind}
      data-presentation-emphasis={emphasis ? String(emphasis) : undefined}
      {...rest}
      style={{ ...(placed ? { position: 'absolute' } : null), left: x, top: y, width, height, ...style }}
    >
      {children}
    </motion.div>
  )
}
