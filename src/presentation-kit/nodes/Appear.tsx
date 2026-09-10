import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

interface AppearProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function Appear({ children, delay = ENTER_DELAY, className }: AppearProps) {
  return <motion.div className={`presentation-appear${className ? ` ${className}` : ''}`} data-presentation-appear initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay, ease: EASE }}>{children}</motion.div>
}
