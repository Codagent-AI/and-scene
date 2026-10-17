import { EntityNode, type NodeProps } from './EntityNode'

export function Frame(props: NodeProps) {
  return <EntityNode kind="frame" {...props} />
}
