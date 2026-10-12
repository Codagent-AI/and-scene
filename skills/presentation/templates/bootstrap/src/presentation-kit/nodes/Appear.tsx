import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
import type { ReactNode } from 'react'
export function Appear({ children, delay = ENTER_DELAY, className }: { children: ReactNode; delay?: number; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: ENTER_T, delay } }} exit={{ opacity: 0 }} data-presentation-appear="true">{children}</motion.div>
}
