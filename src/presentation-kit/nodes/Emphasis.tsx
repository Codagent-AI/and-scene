import type { CSSProperties, ReactNode } from 'react'
export function Emphasis({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) { return <span className={className} style={style} data-presentation-node="emphasis">{children}</span> }
