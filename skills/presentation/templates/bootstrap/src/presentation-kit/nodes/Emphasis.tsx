import { Node, type NodeProps } from './Node'

export function Emphasis(props: NodeProps) {
  return <Node kind="emphasis" {...props} />
}
