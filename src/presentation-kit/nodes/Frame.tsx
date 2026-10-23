import { Entity, type EntityProps } from './Entity'

/** An enclosing region; the author's CSS decides how it is drawn. */
export function Frame(props: EntityProps) {
  return <Entity kind="frame" aria-hidden {...props} />
}
