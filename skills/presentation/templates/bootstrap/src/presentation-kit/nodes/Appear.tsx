import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'

export function Appear({ children, className }: { children?: ReactNode; className?: string }) {
  return <motion.div className={className} data-presentation-appear initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ENTER_DELAY, duration: ENTER_T }}>{children}</motion.div>
}
