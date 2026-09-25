import { motion } from 'motion/react'
import { nodeProps, type NodeProps } from './shared'

export function Label(props: NodeProps) { return <motion.div {...nodeProps(props, 'presentation-label')} layout transition={{ layout: { type: 'spring', stiffness: 320, damping: 34 } }} /> }
