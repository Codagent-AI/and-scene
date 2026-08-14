import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export function Appear({ className, ...props }: HTMLMotionProps<'div'>) {
  return <motion.div {...props} className={`presentation-appear${className ? ` ${className}` : ''}`} data-presentation-appear initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }} />
}
