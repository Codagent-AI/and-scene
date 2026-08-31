import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'

interface AppearProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  delay?: number
}

export function Appear({ children, className, style, delay = LAYOUT_T + ENTER_DELAY }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear
      className={className}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: ENTER_T, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
