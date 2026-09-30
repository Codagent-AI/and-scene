import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

type SymbolChipProps = { children?: ReactNode; className?: string; icon?: LucideIcon; layoutId: string; style?: CSSProperties }

export function SymbolChip({ children, className, icon: Icon, layoutId, style }: SymbolChipProps) {
  return <motion.span className={className} data-presentation-symbol-chip="true" data-presentation-entity={layoutId} layoutId={layoutId} style={style}>{Icon ? <Icon aria-hidden="true" /> : null}{children}</motion.span>
}
