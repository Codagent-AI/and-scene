import type { CSSProperties, ReactNode } from 'react'
export function SceneLayer({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={['scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene="" style={{ position: 'absolute', inset: 0, ...style }}>{children}</div>
}
