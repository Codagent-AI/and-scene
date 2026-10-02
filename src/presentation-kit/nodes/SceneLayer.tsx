import type { CSSProperties, ReactNode } from 'react'
export function SceneLayer({ className = '', style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) { return <div className={`scene-layer ${className}`.trim()} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }}>{children}</div> }
