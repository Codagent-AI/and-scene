import { BaseNode, type BaseNodeProps } from './BaseNode.tsx'

export type LabelProps = BaseNodeProps

export function Label(props: LabelProps) {
  return <BaseNode as="span" kind="label" {...props} />
}
