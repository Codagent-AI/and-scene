import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
import { cx } from '../utils'
export function Appear({ className, transition, ...props }: HTMLMotionProps<'div'>) { return <motion.div className={cx('scene-appear', className)} data-presentation-appear="" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY, ...transition }} {...props} /> }
