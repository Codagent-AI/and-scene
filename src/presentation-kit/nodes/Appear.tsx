import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

/** Wrap newcomers only. Continuing entities use layoutId directly. */
export function Appear(props: HTMLMotionProps<'div'> & { [attribute: `data-${string}`]: unknown }) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: ENTER_T, delay: 0 } }}
    transition={{ opacity: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE } }}
    {...props} data-presentation-node="appear" />
}
