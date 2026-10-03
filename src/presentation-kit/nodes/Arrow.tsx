import { motion } from 'motion/react'
import { nodeProps, type NodeProps } from './shared'

export function Arrow(props: NodeProps & { from?: string; to?: string }) {
  const { from, to, ...rest } = props
  return <motion.div {...nodeProps(rest, 'presentation-arrow')} data-from={from} data-to={to} layout transition={{ layout: { type: 'spring', stiffness: 320, damping: 34 } }} aria-hidden="true" />
}
