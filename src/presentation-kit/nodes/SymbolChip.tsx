import type { NodeProps } from '../types'
export function SymbolChip({ children, className = '', ...props }: NodeProps) {
  return <span className={`scene-symbol-chip ${className}`.trim()} data-presentation-node="symbol-chip" {...props}>{children}</span>
}
