import { motion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type SymbolChipProps = Omit<ComponentProps<typeof motion.div>, 'layoutId'> & { id: string; icon?: LucideIcon; children?: ReactNode }

export function SymbolChip({ id, icon: Icon, children, ...props }: SymbolChipProps) {
  return <motion.div {...props} layout layoutId={id} data-presentation-node="symbol-chip" data-entity-id={id}>{Icon ? <Icon aria-hidden="true" /> : null}{children}</motion.div>
}
