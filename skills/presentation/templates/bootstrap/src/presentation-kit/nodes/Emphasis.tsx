import { EntityNode, type NodeProps } from './EntityNode'

export function Emphasis(props: NodeProps) {
  return <EntityNode kind="emphasis" {...props} />
}
