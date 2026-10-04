import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function Frame({ id, children, className, style }: { id: string; children?: ReactNode; className?: string; style?: CSSProperties }) { return <motion.div layout layoutId={id} className={['scene-frame', className].filter(Boolean).join(' ')} style={style} data-presentation-node="frame" data-entity-id={id}>{children}</motion.div> }
