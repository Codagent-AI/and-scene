import { Node, type NodeProps } from './Node'

export function Label(props: NodeProps) {
  return <Node kind="label" {...props} />
}
