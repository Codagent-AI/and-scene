import type { CSSProperties, ReactNode } from 'react'
export function SymbolChip({ children, className = '', style, ...props }: { children: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: string | undefined }) {
  return <span className={`scene-symbol-chip ${className}`.trim()} data-presentation-node="symbol-chip" style={style} {...props}>{children}</span>
}
