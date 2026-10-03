import type { NodeProps } from '../types'
export function Frame({ children, className = '', ...props }: NodeProps) {
  return <div className={`scene-frame ${className}`.trim()} data-presentation-node="frame" {...props}>{children}</div>
}
