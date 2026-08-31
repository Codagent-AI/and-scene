import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'

interface SymbolChipProps { layoutId: string; children?: ReactNode; className?: string; style?: CSSProperties; Icon?: LucideIcon }

export function SymbolChip({ layoutId, children, className, style, Icon }: SymbolChipProps) {
  return <motion.div layout data-presentation-node="symbol-chip" data-presentation-entity={layoutId} layoutId={layoutId} className={className} style={style}>{Icon && <Icon aria-hidden="true" />} {children}</motion.div>
}
