import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { enterMotion } from '../constants'
// Wrap only genuinely new identities in this component. Keep its key stable while they persist.
export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-appear="" {...enterMotion} {...props} />
}
