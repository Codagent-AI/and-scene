import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Box({ id, children, className, style, icon: Icon, ...props }: { id: string; children: ReactNode; className?: string; style?: CSSProperties; icon?: LucideIcon } & Record<string, unknown>) {
  return <motion.div layout layoutId={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: ENTER_T, delay: ENTER_DELAY }, layout: { duration: 0.55 } }} className={className} style={style} data-presentation-node="box" data-entity-id={id} {...props as object}>{Icon && <Icon aria-hidden="true" />} {children}</motion.div>
}
