import { motion } from 'motion/react'
import { entityMotion } from './entityMotion'
import type { CSSProperties, ReactNode } from 'react'
export function SymbolChip({ id, children, className, style }: { id: string; children: ReactNode; className?: string; style?: CSSProperties }) { return <motion.span layout layoutId={id} {...entityMotion} className={className} style={style} data-presentation-node="symbol-chip" data-entity-id={id}>{children}</motion.span> }
