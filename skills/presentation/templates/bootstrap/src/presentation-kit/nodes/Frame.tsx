import type { CSSProperties, ReactNode } from 'react'
export function Frame({ children, className, style, label }: { children: ReactNode; className?: string; style?: CSSProperties; label?: string }) { return <div className={className} style={style} data-presentation-node="frame" data-label={label}>{children}</div> }
