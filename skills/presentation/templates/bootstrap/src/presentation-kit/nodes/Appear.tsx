import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear(props: HTMLMotionProps<'div'> & { isNew?: boolean }) { const { isNew = true, ...rest } = props; return <motion.div data-presentation-appear {...rest} initial={isNew ? { opacity: 0 } : false} animate={{ opacity: 1, transition: { duration: ENTER_T, delay: isNew ? ENTER_DELAY : 0 } }} exit={{ opacity: 0 }} /> }
