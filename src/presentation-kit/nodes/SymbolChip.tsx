import type { HTMLAttributes } from 'react'
export function SymbolChip({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={['scene-symbol-chip', className].filter(Boolean).join(' ')} data-presentation-node="symbol-chip">{children}</span>
}
