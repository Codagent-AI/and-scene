import { BaseNode, type BaseNodeProps } from './BaseNode.tsx'

export type EmphasisProps = BaseNodeProps

export function Emphasis(props: EmphasisProps) {
  return <BaseNode as="div" kind="emphasis" {...props} />
}
