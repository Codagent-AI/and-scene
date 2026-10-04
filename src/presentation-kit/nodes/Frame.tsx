import { motion } from 'motion/react'
import type { NodeProps } from './shared'
import { nodeAttributes } from './shared'
export function Frame(props: NodeProps) { return <motion.div {...nodeAttributes(props)} data-presentation-frame="">{props.children}</motion.div> }
