import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div {...props} data-presentation-appear initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: ENTER_DELAY, duration: ENTER_T, ease: EASE }} />
}
