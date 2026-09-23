import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'

export function Box({ id, children, Icon, className, style, ...props }: { id: string; children?: ReactNode; Icon?: LucideIcon; className?: string; style?: CSSProperties; [key: `data-${string}`]: string | undefined }) {
  return <motion.div layout layoutId={id} exit={{ opacity: 0 }} className={['scene-box', className].filter(Boolean).join(' ')} data-presentation-node="box" data-entity-id={id} style={style} {...props}>{Icon && <Icon className="scene-box-icon" aria-hidden="true" />}<span className="scene-box-content">{children}</span></motion.div>
}
