import { motion } from 'motion/react'
import { EXIT } from '../constants'
import type { PrimitiveProps } from '../types'
export function Frame({ id, className = '', style, children }: PrimitiveProps) { return <motion.div layoutId={id} exit={EXIT} className={`scene-frame ${className}`.trim()} data-presentation-node="frame" data-presentation-entity={id} style={style}>{children}</motion.div> }
