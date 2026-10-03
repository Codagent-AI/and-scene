import { motion } from 'motion/react'
import type { NodeProps } from './Box'
export function Emphasis({ id, className = '', style, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} className={`scene-emphasis ${className}`} style={style} data-presentation-node="emphasis" {...props}>{children}</motion.div> }
