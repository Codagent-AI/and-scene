import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
export function Frame({ id, children, label, className, style }: { id: string; children: ReactNode; label?: string; className?: string; style?: CSSProperties }) {
  return <motion.div layout layoutId={id} exit={{ opacity: 0 }} className={['scene-frame', className].filter(Boolean).join(' ')} data-presentation-node="frame" data-entity-id={id} style={style}>{label && <span className="scene-frame-label">{label}</span>}{children}</motion.div>
}
