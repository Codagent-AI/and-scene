import { motion } from 'motion/react'
import type { NodeProps } from './shared'
import { nodeAttributes } from './shared'
export function Emphasis(props: NodeProps) { return <motion.div {...nodeAttributes(props)} data-presentation-emphasis="">{props.children}</motion.div> }
