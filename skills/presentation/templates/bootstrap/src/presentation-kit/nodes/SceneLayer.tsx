import type { CSSProperties, ReactNode } from 'react'
export function SceneLayer({ children, className, style, ...dataProps }: { children?: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: unknown }) { return <div className={className} style={{ ...style, position: 'absolute', inset: 0 }} data-presentation-scene-layer {...dataProps}>{children}</div> }
