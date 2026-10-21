import { Node, type NodeProps } from './Node'

/** A marker that flags another entity (ring, badge, highlight) once styled. */
export function Emphasis(props: NodeProps) {
  return <Node kind="emphasis" {...props} />
}
