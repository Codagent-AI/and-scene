import type { CSSProperties, ReactNode } from 'react'

export function SceneLayer({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div data-scene-layer="true" className={className} style={{ position: 'absolute', inset: 0, ...style }}>{children}</div>
}
