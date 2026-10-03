import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants.js'
type Props = Omit<HTMLMotionProps<'div'>, 'ref'> & { newcomer?: boolean }
export function Appear({ newcomer = true, className, ...props }: Props) { return <motion.div initial={newcomer ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: newcomer ? ENTER_DELAY : 0 }} className={['presentation-appear', className].filter(Boolean).join(' ')} data-presentation-appear="" {...props} /> }
