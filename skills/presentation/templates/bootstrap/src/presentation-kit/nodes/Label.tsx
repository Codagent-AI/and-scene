import { motion } from 'motion/react'
import type { PrimitiveProps } from '../types'
export function Label({ id, className = '', style, children }: PrimitiveProps) { return <motion.div layoutId={id} className={`scene-label ${className}`.trim()} data-presentation-node="label" data-presentation-entity={id} style={style}>{children}</motion.div> }
