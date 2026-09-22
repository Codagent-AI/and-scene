import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function Box({ id, children, className, style, ...props }: { id: string; children: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: string | undefined }) {
  return <motion.div layout layoutId={id} exit={{ opacity: 0 }} className={className} style={style} data-presentation-box="" {...props}>{children}</motion.div>
}
