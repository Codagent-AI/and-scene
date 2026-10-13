import type { LucideIcon } from 'lucide-react'
import { Node } from './Node'
import type { NodeProps } from './Node'

/** Card semantics; authors supply their own border and card treatment. */
export function Box({ Icon, children, ...props }: NodeProps & { Icon?: LucideIcon }) {
  return <Node {...props} kind="box">{Icon && <Icon aria-hidden="true" />}{children}</Node>
}
