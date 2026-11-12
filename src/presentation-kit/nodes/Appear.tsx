import type { HTMLMotionProps } from 'motion/react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear(props: HTMLMotionProps<'div'>) { return <motion.div data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: ENTER_DELAY, duration: ENTER_T }} {...props} /> }
