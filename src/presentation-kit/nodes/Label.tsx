import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function Label({ id, children, className, style }: { id?: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return <motion.span layout={Boolean(id)} layoutId={id} exit={{ opacity: 0 }} className={className} style={style} data-presentation-label="">{children}</motion.span>
}
