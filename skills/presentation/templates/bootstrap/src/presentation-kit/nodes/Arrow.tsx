import { motion } from 'motion/react'
import type { NodeProps } from './Box'
export function Arrow({ id, className = '', style, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} className={`scene-arrow ${className}`} style={style} data-presentation-node="arrow" aria-hidden="true" {...props}>{children}</motion.div> }
