import type { CSSProperties, ReactNode } from 'react'
export function SceneLayer({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) { return <div className={`scene-layer ${className}`} style={{ position: 'absolute', inset: 0, ...style }} data-presentation-scene-layer="">{children}</div> }
