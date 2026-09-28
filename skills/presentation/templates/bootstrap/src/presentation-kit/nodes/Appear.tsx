import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface AppearProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Wraps a newcomer entity so it enters only after persisting entities have
 * finished their layout-projection morph (see ENTER_DELAY). Do not wrap
 * entities that continue across grouped steps — those morph via layoutId
 * instead of fading in as newcomers.
 */
export function Appear({ className, style, children }: AppearProps) {
  return (
    <motion.div
      data-presentation-node="appear"
      className={className}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
