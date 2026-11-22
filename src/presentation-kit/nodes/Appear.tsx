import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-appear="" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, transition: { duration: ENTER_T } }}
    transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }} {...props} />
}
