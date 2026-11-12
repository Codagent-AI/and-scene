import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div {...props} data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T } }} exit={{ opacity: 0, transition: { duration: ENTER_T } }} />
}
