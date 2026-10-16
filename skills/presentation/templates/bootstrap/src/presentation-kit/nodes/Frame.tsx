import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { entityProps } from './entity'

export interface FrameProps extends HTMLMotionProps<'div'> {
  id: string
}

/** Outline that encloses other entities; carries no border of its own. */
export function Frame({ id, transition, ...rest }: FrameProps) {
  return <motion.div {...entityProps(id, 'frame', undefined, transition)} {...rest} />
}
