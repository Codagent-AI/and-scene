import { Node, type NodeProps } from './Node'

/** Marker (ring, flag, highlight) drawn over an entity. */
export function Emphasis(props: NodeProps) {
  return <Node kind="emphasis" {...props} />
}
