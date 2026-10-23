import { motion } from 'motion/react'
import { appearProps, exitProps, nodeHooks } from './shared'
import type { NodeProps } from './types'

/**
 * Wraps arbitrary content so it fades in after persisting entities have settled.
 * Fades only on mount; keep it mounted for as long as the content continues.
 */
export function Appear({ layoutId, variant, ...rest }: Omit<NodeProps, 'at' | 'appear'>) {
  return (
    <motion.div
      {...nodeHooks('appear', layoutId, variant)}
      {...appearProps(true)}
      {...exitProps}
      {...rest}
    />
  )
}
