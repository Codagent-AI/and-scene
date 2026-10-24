import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT, placementStyle, type Placement } from './shared'

export interface EmphasisProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId'> {
  id: string
  at?: Placement
}

/** A marker drawn over another entity to call attention to it. */
export function Emphasis({ id, at, style, ...rest }: EmphasisProps) {
  return (
    <motion.div
      layoutId={id}
      exit={EXIT}
      aria-hidden
      data-presentation-entity={id}
      data-presentation-node="emphasis"
      style={{ ...placementStyle(at), pointerEvents: 'none', ...style }}
      {...rest}
    />
  )
}
