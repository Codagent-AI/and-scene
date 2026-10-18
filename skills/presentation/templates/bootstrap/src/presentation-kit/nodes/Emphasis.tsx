import { NodeShell, type NodeProps } from './node'

/** A marker (ring, flag, highlight) that calls attention to an entity. */
export function Emphasis({ children, ...props }: NodeProps) {
  return (
    <NodeShell kind="emphasis" props={props}>
      {children}
    </NodeShell>
  )
}
