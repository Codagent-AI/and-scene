import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T, EASE } from '../constants'
import { classNames } from './classNames'

export interface AppearProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Wraps a genuinely new entity so it enters only after persisting entities
 * have settled into their new layout positions. Continuing entities should
 * not be wrapped in `Appear` — they morph via `layoutId` alone.
 */
export function Appear({ className, style, children }: AppearProps) {
  return (
    <motion.div
      className={classNames('sk-appear', className)}
      style={style}
      data-scene-kit="appear"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
