import { motion } from 'motion/react'
import type { PrimitiveProps } from '../types'
export function Emphasis({ id, className = '', style, children }: PrimitiveProps) { return <motion.div layoutId={id} className={`scene-emphasis ${className}`.trim()} data-presentation-node="emphasis" data-presentation-entity={id} style={style}>{children}</motion.div> }
