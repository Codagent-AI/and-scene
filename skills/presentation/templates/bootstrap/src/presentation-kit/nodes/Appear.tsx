import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear({ children, className, delay = ENTER_DELAY }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={['scene-appear', className].filter(Boolean).join(' ')} data-presentation-appear initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: ENTER_T, delay }}>{children}</motion.div>
}
