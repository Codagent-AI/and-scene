import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
// Keep this keyed wrapper mounted for continuing entities; only newcomers run initial.
export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: ENTER_T, delay: 0 } }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }} {...props} />
}
