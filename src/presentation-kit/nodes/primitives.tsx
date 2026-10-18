import { NodeBase, type NodeProps } from './Node'

export function Box(props: NodeProps) {
  return <NodeBase kind="box" {...props} />
}

export function Label(props: NodeProps) {
  return <NodeBase kind="label" {...props} />
}

export function Frame(props: NodeProps) {
  return <NodeBase kind="frame" {...props} />
}

export function Emphasis(props: NodeProps) {
  return <NodeBase kind="emphasis" {...props} />
}

/** A compact symbol/label chip. */
export function SymbolChip(props: NodeProps) {
  return <NodeBase kind="symbol-chip" {...props} />
}
