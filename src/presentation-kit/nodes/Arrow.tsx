import type { CSSProperties, ReactNode } from 'react'

export function Arrow({ id, children, className, style }: { id: string; children?: ReactNode; className?: string; style?: CSSProperties }) { return <span className={className} style={style} data-presentation-arrow data-entity-id={id} aria-hidden="true">{children ?? '→'}</span> }
