import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'
export function Appear({ children, ...props }: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: ENTER_T, delay: 0 } }} transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }} {...props}>{children}</motion.div>
}
