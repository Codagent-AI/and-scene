import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
export function Label({ id, children, className, style }: { id: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return <motion.div layout layoutId={id} exit={{ opacity: 0 }} className={['scene-label', className].filter(Boolean).join(' ')} data-presentation-node="label" data-entity-id={id} style={style}>{children}</motion.div>
}
