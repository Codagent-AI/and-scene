import { Entity, type EntityProps } from './Entity'

export interface ArrowProps extends EntityProps {
  /** Semantic hint for authors' CSS, e.g. "right" or "down". */
  direction?: string
}

export function Arrow({ direction, ...rest }: ArrowProps) {
  return <Entity kind="arrow" data-presentation-direction={direction} {...rest} />
}
