import { motion, type HTMLMotionProps } from 'motion/react'
import { enterProps } from './enter'

/**
 * Fades its children in after persisting entities settle. It animates only on
 * mount, so an entity that continues across steps is never re-faded.
 */
export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-node="appear" {...enterProps} {...props} />
}
