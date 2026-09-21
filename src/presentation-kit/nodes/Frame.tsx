import type { CSSProperties, ReactNode } from 'react'

export function Frame({ id, children, className, style }: { id: string; children?: ReactNode; className?: string; style?: CSSProperties }) { return <div className={className} style={style} data-presentation-frame data-entity-id={id}>{children}</div> }
