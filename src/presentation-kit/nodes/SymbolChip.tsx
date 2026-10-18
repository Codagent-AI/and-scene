import type { LucideIcon } from 'lucide-react'
import { NodeShell, type NodeProps } from './node'

export interface SymbolChipProps extends NodeProps {
  Icon?: LucideIcon
  symbol?: string
}

/** A small chip carrying a symbol, glyph, or short text. */
export function SymbolChip({ Icon, symbol, children, ...props }: SymbolChipProps) {
  return (
    <NodeShell kind="symbol-chip" props={props}>
      {Icon && (
        <span data-presentation-glyph="">
          <Icon aria-hidden />
        </span>
      )}
      {symbol !== undefined && <span data-presentation-symbol="">{symbol}</span>}
      {children}
    </NodeShell>
  )
}
