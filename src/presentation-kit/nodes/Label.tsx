import type { CSSProperties, ReactNode } from 'react'

export function Label({ id, children, className, style }: { id?: string; children?: ReactNode; className?: string; style?: CSSProperties }) { return <span className={className} style={style} data-presentation-label data-entity-id={id}>{children}</span> }
