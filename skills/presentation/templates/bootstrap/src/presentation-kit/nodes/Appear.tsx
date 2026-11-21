import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../constants'

export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div {...props} data-presentation-appear=""
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } }}
    exit={{ opacity: 0, transition: { duration: EXIT_T } }} />
}
