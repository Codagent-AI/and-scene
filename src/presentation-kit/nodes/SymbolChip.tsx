import { motion } from 'motion/react'
import { nodeProps, type NodeProps } from './shared'

export function SymbolChip(props: NodeProps) { return <motion.div {...nodeProps(props, 'presentation-symbol-chip')} layout transition={{ layout: { type: 'spring', stiffness: 320, damping: 34 } }} /> }
