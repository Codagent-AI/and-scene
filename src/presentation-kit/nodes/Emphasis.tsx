import type { CSSProperties, ReactNode } from 'react'

export function Emphasis({ id, children, className, style }: { id: string; children?: ReactNode; className?: string; style?: CSSProperties }) { return <span className={className} style={style} data-presentation-emphasis data-entity-id={id}>{children}</span> }
