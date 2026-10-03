import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function Box({ id, children, className, style, ...props }: { id: string; children?: ReactNode; className?: string; style?: CSSProperties } & Record<string, unknown>) {
  return <motion.div layoutId={id} className={className} style={style} data-presentation-node="box" data-presentation-id={id} {...props}>{children}</motion.div>
}
