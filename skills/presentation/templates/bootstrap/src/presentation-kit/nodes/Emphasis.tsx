import { motion } from 'motion/react'
import { entityMotion } from './entityMotion'
import type { CSSProperties, ReactNode } from 'react'
export function Emphasis({ id, children, className, style }: { id: string; children: ReactNode; className?: string; style?: CSSProperties }) { return <motion.div layout layoutId={id} {...entityMotion} className={className} style={style} data-presentation-node="emphasis" data-entity-id={id}>{children}</motion.div> }
