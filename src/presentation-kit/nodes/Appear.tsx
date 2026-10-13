import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear({ children, className = '', delay = ENTER_DELAY, present = true }: { children: ReactNode; className?: string; delay?: number; present?: boolean }) {
  return <AnimatePresence initial={false} mode="popLayout">{present && <motion.div key="present" className={className} data-presentation-appear initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay, duration: ENTER_T } }} exit={{ opacity: 0, transition: { duration: 0.18 } }}>{children}</motion.div>}</AnimatePresence>
}
