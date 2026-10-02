import { motion, type MotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'

export function Appear({ children, delay = ENTER_DELAY, className, ...props }: { children: ReactNode; delay?: number; className?: string } & Omit<MotionProps, 'children'>) {
  return <motion.div className={['scene-appear', className].filter(Boolean).join(' ')} data-scene-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay }} {...props}>{children}</motion.div>
}
