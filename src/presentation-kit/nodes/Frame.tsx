import { motion } from 'motion/react'
import type { NodeProps } from './Box'
import { LAYOUT_T } from '../constants'
export function Frame({id,children,Icon,...props}:NodeProps) {return <motion.div layout layoutId={id} transition={{layout:LAYOUT_T}} exit={{opacity:0}} data-presentation-node="frame" {...props}>{Icon && <Icon/>}{children}</motion.div>}
