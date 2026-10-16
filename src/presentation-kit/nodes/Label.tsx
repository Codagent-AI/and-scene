import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { entityProps } from './entity'

export interface LabelProps extends HTMLMotionProps<'span'> {
  id: string
}

export function Label({ id, transition, ...rest }: LabelProps) {
  return <motion.span {...entityProps(id, 'label', undefined, transition)} {...rest} />
}
