import type { CSSProperties, ReactNode } from 'react'

export function SceneLayer({ children, className, style, ...props }: { children: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: unknown }) {
  return <div className={['scene-layer', className].filter(Boolean).join(' ')} style={{ position: 'absolute', inset: 0, ...style }} data-scene-layer="" {...props}>{children}</div>
}
