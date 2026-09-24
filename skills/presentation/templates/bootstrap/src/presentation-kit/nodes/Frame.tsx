import type { CSSProperties, ReactNode } from 'react'
export function Frame({ children, className = '', style, ...props }: { children: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: string | undefined }) {
  return <div className={`scene-frame ${className}`.trim()} data-presentation-node="frame" style={style} {...props}>{children}</div>
}
