import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function Box({ id, children, className, style, ...props }: { id: string; children?: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: string | undefined }) {
  return <motion.div layout layoutId={id} className={['scene-box', className].filter(Boolean).join(' ')} style={style} data-presentation-node="box" data-entity-id={id} {...props}>{children}</motion.div>
}
