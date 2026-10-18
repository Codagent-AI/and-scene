import { NodeShell, type NodeProps } from './node'

/** A region drawn around other entities. Its look (border, label) comes from presentation CSS. */
export function Frame({ children, ...props }: NodeProps) {
  return (
    <NodeShell kind="frame" props={props}>
      {children}
    </NodeShell>
  )
}
