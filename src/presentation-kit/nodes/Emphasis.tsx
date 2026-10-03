import { motion } from 'motion/react'
import { nodeProps, type NodeProps } from './shared'

export function Emphasis(props: NodeProps) { return <motion.div {...nodeProps(props, 'presentation-emphasis')} layout transition={{ layout: { type: 'spring', stiffness: 320, damping: 34 } }} /> }
