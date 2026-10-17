import { EntityNode, type NodeProps } from './EntityNode'

export function Box(props: NodeProps) {
  return <EntityNode kind="box" {...props} />
}
