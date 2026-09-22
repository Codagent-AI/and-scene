import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear({ children, className, delay = ENTER_DELAY }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: ENTER_T, delay } }} exit={{ opacity: 0 }}>{children}</motion.div>
}
