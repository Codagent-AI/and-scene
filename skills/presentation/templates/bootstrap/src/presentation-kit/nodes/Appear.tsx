import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { appearMotion } from './appearMotion'

export interface AppearProps {
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/** Wrap only entities that are new in the active step; persisting entities must not use it. */
export function Appear({ className, style, children }: AppearProps) {
  return (
    <motion.div data-presentation-appear="" className={className} style={style} {...appearMotion}>
      {children}
    </motion.div>
  )
}
