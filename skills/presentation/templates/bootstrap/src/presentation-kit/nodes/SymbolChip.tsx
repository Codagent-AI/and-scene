import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Entity } from './Entity.tsx'
import type { NodeHooks } from './placement.ts'

export interface SymbolChipProps extends NodeHooks {
  Icon?: LucideIcon
  children?: ReactNode
}

export function SymbolChip(props: SymbolChipProps) {
  return <Entity kind="symbol-chip" {...props} />
}
