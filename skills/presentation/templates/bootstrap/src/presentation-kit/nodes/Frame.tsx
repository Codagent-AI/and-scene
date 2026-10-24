import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT, placementStyle, type Placement } from './shared'

export interface FrameProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId'> {
  id: string
  at?: Placement
}

/** An outline region drawn around other entities. Visuals come from the presentation. */
export function Frame({ id, at, style, ...rest }: FrameProps) {
  return (
    <motion.div
      layoutId={id}
      exit={EXIT}
      data-presentation-entity={id}
      data-presentation-node="frame"
      style={{ ...placementStyle(at), ...style }}
      {...rest}
    />
  )
}
