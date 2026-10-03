import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function Box({ id, children, className, style, Icon }: { id: string; children?: ReactNode; className?: string; style?: CSSProperties; Icon?: LucideIcon }) {
  return <motion.div layout layoutId={id} className={className} style={style} data-presentation-box data-entity-id={id}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
