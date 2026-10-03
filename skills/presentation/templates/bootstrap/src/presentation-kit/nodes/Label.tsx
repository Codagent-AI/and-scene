import { motion } from 'motion/react'
import { entityMotion } from './entityMotion'
import type { CSSProperties, ReactNode } from 'react'
export function Label({ id, children, className, style }: { id: string; children: ReactNode; className?: string; style?: CSSProperties }) { return <motion.span layout layoutId={id} {...entityMotion} className={className} style={style} data-presentation-node="label" data-entity-id={id}>{children}</motion.span> }
