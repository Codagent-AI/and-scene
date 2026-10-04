import type { CSSProperties, ReactNode } from 'react'
export function SceneLayer({ children, className, style, ...props }: { children: ReactNode; className?: string; style?: CSSProperties; 'data-allow-overlap'?: string }) { return <div className={className} style={{ position: 'absolute', inset: 0, ...style }} data-presentation-layer="" {...props}>{children}</div> }
