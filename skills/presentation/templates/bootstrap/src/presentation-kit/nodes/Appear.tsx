import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { appearMotion } from './transitions'

export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-appear="" {...appearMotion} {...props} />
}
