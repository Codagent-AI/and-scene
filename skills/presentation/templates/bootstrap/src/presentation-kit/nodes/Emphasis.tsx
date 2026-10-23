import { NodeBase, type NodeProps } from './NodeBase'

/** Highlight wrapper for content that needs attention. */
export function Emphasis(props: NodeProps) {
  return <NodeBase data-presentation-emphasis="" {...props} />
}
