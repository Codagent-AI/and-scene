import type { LucideIcon } from 'lucide-react'
import { NodeShell, type NodeProps } from './node'

export interface BoxProps extends NodeProps {
  /** Optional glyph, passed as a component (icon-as-component). */
  Icon?: LucideIcon
  label?: string
}

export function Box({ Icon, label, children, ...props }: BoxProps) {
  return (
    <NodeShell kind="box" props={props}>
      {Icon && (
        <span data-presentation-glyph="">
          <Icon aria-hidden />
        </span>
      )}
      {label !== undefined && <span data-presentation-label="">{label}</span>}
      {children}
    </NodeShell>
  )
}
