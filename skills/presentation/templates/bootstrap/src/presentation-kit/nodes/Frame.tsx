import type { HTMLAttributes } from 'react'
export function Frame({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={['scene-frame', className].filter(Boolean).join(' ')} data-presentation-node="frame">{children}</div>
}
