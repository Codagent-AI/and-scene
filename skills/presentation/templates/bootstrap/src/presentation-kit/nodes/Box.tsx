import type { LucideIcon } from 'lucide-react'
import { Node } from './Node'
import type { NodeProps } from './Node'
export function Box({
  Icon,
  children,
  ...props
}: NodeProps & { Icon?: LucideIcon }) {
  return (
    <Node data-presentation-node="box" {...props}>
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </Node>
  )
}
