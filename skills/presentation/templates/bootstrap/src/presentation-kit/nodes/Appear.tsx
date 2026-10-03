import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear(props: HTMLMotionProps<'div'>) { return <motion.div {...props} data-presentation-node="appear" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } }} exit={{ opacity: 0 }} /> }
