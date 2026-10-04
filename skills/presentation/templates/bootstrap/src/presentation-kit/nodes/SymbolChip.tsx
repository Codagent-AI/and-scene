import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function SymbolChip({ id, children, className, style }: { id: string; children: ReactNode; className?: string; style?: CSSProperties }) { return <motion.div layout layoutId={id} className={['scene-symbol-chip', className].filter(Boolean).join(' ')} style={style} data-presentation-node="symbol-chip" data-entity-id={id}>{children}</motion.div> }
