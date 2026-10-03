import type { CSSProperties, ReactNode } from 'react'
export function Label({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) { return <span className={className} style={style} data-presentation-node="label">{children}</span> }
