import { IconNode, type IconNodeProps } from './IconNode'

export type BoxProps = IconNodeProps

/** Generic bordered-card primitive; carries no palette, border, or shadow defaults. */
export function Box(props: BoxProps) {
  return <IconNode node="box" iconSize={20} {...props} />
}
