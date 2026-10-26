import { motion } from 'motion/react'
import type { ComponentPropsWithoutRef } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export type AppearProps = ComponentPropsWithoutRef<typeof motion.div>

/**
 * Wraps a newcomer entity so it animates in only after persisting entities'
 * layout-projection morph (LAYOUT_T) has settled.
 */
export function Appear({ className, children, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
