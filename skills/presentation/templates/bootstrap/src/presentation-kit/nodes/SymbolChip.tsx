import type { CSSProperties, ReactNode } from 'react'
export function SymbolChip({ children, className, style, id }: { children: ReactNode; className?: string; style?: CSSProperties; id?: string }) { return <span className={className} style={style} data-presentation-node="symbol-chip" data-presentation-id={id}>{children}</span> }
