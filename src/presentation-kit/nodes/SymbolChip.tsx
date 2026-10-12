import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
type SymbolChipProps = Omit<HTMLMotionProps<'div'>, 'children'> & { layoutId: string; Icon?: LucideIcon; children?: ReactNode }
export function SymbolChip({ layoutId, Icon, children, ...props }: SymbolChipProps) { return <motion.div {...props} layout layoutId={layoutId} data-presentation-node="symbol-chip">{Icon && <Icon aria-hidden="true" />}{children}</motion.div> }
