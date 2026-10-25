import type { LucideIcon } from 'lucide-react'
import type { NodeProps } from './base.ts'
import { LayoutNode } from './LayoutNode.tsx'

export type SymbolChipProps = NodeProps & { Icon?: LucideIcon; tone?: string }

/** A small symbol chip. `tone` is exposed as data-tone for presentation CSS. */
export function SymbolChip({ tone, ...props }: SymbolChipProps) {
  return <LayoutNode kind="symbol-chip" data-tone={tone} {...props} />
}
