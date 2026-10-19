import type { LucideIcon } from 'lucide-react'
import { Box, type EntityProps } from './Box'

export function SymbolChip(props: EntityProps & { Icon?: LucideIcon; label?: string }) {
  return <Box kind="symbol-chip" {...props} />
}
