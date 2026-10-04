import { motion } from 'motion/react'
import type { NodeProps } from './shared'
import { nodeAttributes } from './shared'
export function Arrow({ label, ...props }: NodeProps & { label?: string }) { return <motion.div {...nodeAttributes(props)} data-presentation-arrow="" aria-label={label}>{props.children}</motion.div> }
