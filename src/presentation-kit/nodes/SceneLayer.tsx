import type { CSSProperties, HTMLAttributes } from 'react'
export function SceneLayer({ className = '', style, ...props }: HTMLAttributes<HTMLDivElement> & { style?: CSSProperties }) { return <div className={className} data-presentation-scene-layer style={{ position: 'absolute', inset: 0, ...style }} {...props} /> }
