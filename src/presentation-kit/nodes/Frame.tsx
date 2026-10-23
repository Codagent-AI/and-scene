import { Node, type NodeProps } from './Node'

export function Frame(props: NodeProps) {
  return <Node kind="frame" {...props} />
}
