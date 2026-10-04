import type { CSSProperties, ReactNode } from 'react'
export function SceneLayer({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) { return <div className={['presentation-scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }}>{children}</div> }
