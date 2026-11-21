import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { entityTransition } from './transitions'

export function Emphasis(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-emphasis="" layout transition={entityTransition} {...props} />
}
