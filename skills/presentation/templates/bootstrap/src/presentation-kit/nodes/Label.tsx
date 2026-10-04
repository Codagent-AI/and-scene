import { motion } from 'motion/react'
import type { NodeProps } from './shared'
import { nodeAttributes } from './shared'
export function Label(props: NodeProps) { return <motion.div {...nodeAttributes(props)} data-presentation-label="">{props.children}</motion.div> }
