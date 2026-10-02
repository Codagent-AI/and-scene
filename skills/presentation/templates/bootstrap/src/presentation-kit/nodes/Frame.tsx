import { motion } from 'motion/react'
import type { PrimitiveProps } from '../types'
export function Frame({ id, className = '', style, children }: PrimitiveProps) { return <motion.div layoutId={id} className={`scene-frame ${className}`.trim()} data-presentation-node="frame" data-presentation-entity={id} style={style}>{children}</motion.div> }
