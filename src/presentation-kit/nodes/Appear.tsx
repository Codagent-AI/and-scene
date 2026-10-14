import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EASE } from '../constants'
import { nodeAttrs, type NodeCommonProps } from './shared'

export interface AppearProps extends NodeCommonProps {
  /** Seconds to wait before fading in. Defaults to letting persisting entities settle. */
  delay?: number
  children: ReactNode
}

/**
 * Wrap only newcomers in Appear. It fades in after persisting entities have
 * moved, so new content arrives as the continuing content settles. Never wrap a
 * continuing entity; it would fade in again instead of morphing.
 */
export function Appear({ id, delay = ENTER_DELAY, children, className, style, data }: AppearProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ENTER_T, delay, ease: EASE }}
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
      {...nodeAttrs('appear', id, data)}
    >
      {children}
    </motion.div>
  )
}
