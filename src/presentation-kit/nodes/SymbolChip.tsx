import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'

interface SymbolChipProps {
  layoutId: string
  children: ReactNode
  Icon?: LucideIcon
  className?: string
  style?: CSSProperties
}

export function SymbolChip({ layoutId, children, Icon, className, style }: SymbolChipProps) {
  return <motion.div style={style} layout layoutId={layoutId} className={`presentation-symbol-chip${className ? ` ${className}` : ''}`} data-presentation-symbol-chip data-presentation-entity={layoutId}>{Icon ? <Icon aria-hidden="true" /> : null}{children}</motion.div>
}
