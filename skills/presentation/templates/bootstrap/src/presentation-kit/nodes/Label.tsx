import { motion } from 'motion/react'
import type { NodeProps } from './Box'
export function Label({ id, className = '', style, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} className={`scene-label ${className}`} style={style} data-presentation-node="label" {...props}>{children}</motion.div> }
