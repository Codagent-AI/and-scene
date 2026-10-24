import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT, placementStyle, type Placement } from './shared'

export interface LabelProps extends Omit<HTMLMotionProps<'span'>, 'id' | 'layoutId'> {
  id: string
  at?: Placement
}

export function Label({ id, at, style, ...rest }: LabelProps) {
  return (
    <motion.span
      layoutId={id}
      exit={EXIT}
      data-presentation-entity={id}
      data-presentation-node="label"
      style={{ ...placementStyle(at), ...style }}
      {...rest}
    />
  )
}
