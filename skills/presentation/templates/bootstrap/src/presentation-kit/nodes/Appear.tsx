import { motion } from 'motion/react'
import type { NodeProps } from './common.ts'
import { ENTER_DELAY, ENTER_T, EXIT_T } from '../constants.ts'

export type AppearProps = NodeProps<'div'>

/**
 * Wraps a newcomer so it fades in only after persisting entities have moved
 * (`ENTER_DELAY`) and fades out when it departs. Do not wrap continuing entities.
 */
export function Appear({ style, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
      {...rest}
    />
  )
}
