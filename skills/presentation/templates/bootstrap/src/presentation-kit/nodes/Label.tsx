import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { entityTransition } from './transitions'

export function Label(props: HTMLMotionProps<'span'>) {
  return <motion.span data-presentation-label="" layout transition={entityTransition} {...props} />
}
