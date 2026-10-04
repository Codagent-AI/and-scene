import { motion } from 'motion/react'
import type { NodeProps } from './shared'
import { nodeAttributes } from './shared'
export function SymbolChip(props: NodeProps) { return <motion.div {...nodeAttributes(props)} data-presentation-symbol-chip="">{props.children}</motion.div> }
