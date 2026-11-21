import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { entityTransition } from './transitions'

export function Frame(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-frame="" layout transition={entityTransition} {...props} />
}
