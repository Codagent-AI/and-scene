import { motion } from 'motion/react'
import type { NodeProps } from './Box'
export function Frame({ id, className = '', style, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} className={`scene-frame ${className}`} style={style} data-presentation-node="frame" {...props}>{children}</motion.div> }
