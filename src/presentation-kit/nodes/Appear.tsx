import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants.ts'
export function Appear({ children, className, delay = ENTER_DELAY }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay, duration: ENTER_T } }} exit={{ opacity: 0, transition: { duration: ENTER_T } }}>{children}</motion.div>
}
