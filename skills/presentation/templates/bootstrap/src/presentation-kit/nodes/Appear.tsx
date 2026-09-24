import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear({ children, delay = ENTER_DELAY, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return <motion.div className={`scene-appear ${className}`.trim()} data-presentation-appear initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: ENTER_T, delay }}>{children}</motion.div>
}
