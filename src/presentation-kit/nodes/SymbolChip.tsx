import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { StyleProps } from '../types'
export function SymbolChip({ id, icon: Icon, children, className, style, ...props }: StyleProps & { id: string; icon?: LucideIcon; children?: ReactNode }) {
  return <motion.div layout layoutId={id} className={['scene-symbol-chip', className].filter(Boolean).join(' ')} style={style} data-scene-entity={id} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
