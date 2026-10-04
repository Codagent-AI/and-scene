import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function Label({ id, children, className, style }: { id: string; children: ReactNode; className?: string; style?: CSSProperties }) { return <motion.div layout layoutId={id} className={['scene-label', className].filter(Boolean).join(' ')} style={style} data-presentation-node="label" data-entity-id={id}>{children}</motion.div> }
