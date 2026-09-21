import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'

export function Appear({ delay = ENTER_DELAY, className, ...props }: HTMLMotionProps<'div'> & { delay?: number }) {
  return <motion.div data-scene-node="appear" className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: ENTER_T, delay }} {...props} />
}
