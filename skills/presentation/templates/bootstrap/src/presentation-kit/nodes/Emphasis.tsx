import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function Emphasis({ id, children, className, style }: { id: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return <motion.div layout layoutId={id} exit={{ opacity: 0 }} className={className} style={style} data-presentation-emphasis="">{children}</motion.div>
}
