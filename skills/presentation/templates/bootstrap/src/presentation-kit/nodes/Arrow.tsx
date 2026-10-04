import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function Arrow({ id, children, className, style }: { id: string; children?: ReactNode; className?: string; style?: CSSProperties }) { return <motion.div layout layoutId={id} className={['scene-arrow', className].filter(Boolean).join(' ')} style={style} data-presentation-node="arrow" data-entity-id={id} aria-hidden="true">{children}</motion.div> }
