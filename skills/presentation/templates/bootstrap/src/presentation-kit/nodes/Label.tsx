import { EntityNode, type NodeProps } from './EntityNode'

export function Label(props: NodeProps) {
  return <EntityNode kind="label" {...props} />
}
