import type { CSSProperties, ReactNode } from 'react'

export function SymbolChip({ id, children, className, style }: { id: string; children?: ReactNode; className?: string; style?: CSSProperties }) { return <span className={className} style={style} data-presentation-symbol-chip data-entity-id={id}>{children}</span> }
