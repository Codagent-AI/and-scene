import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export type AppearProps = Omit<HTMLMotionProps<'div'>, 'children' | 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> & { id: string; children: ReactNode; delay?: number }
export function Appear({ id, children, delay = ENTER_DELAY, ...props }: AppearProps) { return <motion.div key={id} data-presentation-appear={id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: ENTER_T, delay } }} exit={{ opacity: 0 }} {...props}>{children}</motion.div> }
