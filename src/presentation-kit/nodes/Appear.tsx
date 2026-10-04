import { motion, type MotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface AppearProps extends MotionProps {
  children: ReactNode
  className?: string
  'data-presentation-id'?: string
}

export function Appear({ children, className, ...props }: AppearProps) {
  return <motion.div {...props} className={['presentation-appear', className].filter(Boolean).join(' ')} data-presentation-appear="" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }}>{children}</motion.div>
}
