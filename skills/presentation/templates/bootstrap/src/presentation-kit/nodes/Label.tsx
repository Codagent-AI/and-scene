import { NodeShell, type NodeProps } from './node'

export function Label({ children, ...props }: NodeProps) {
  return (
    <NodeShell kind="label" props={props}>
      {children}
    </NodeShell>
  )
}
