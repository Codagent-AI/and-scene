import { SceneLayer, type SceneProps } from '../../../presentation-kit'
// import { Arrow, Box, Frame, Label, SymbolChip } from '../../../presentation-kit'
// import { E } from '../entities'

/**
 * One scene shared by every step in a group (give those steps the same `groupKey`).
 * Compose kit primitives inside <SceneLayer> on the 880 x 380 design canvas, and
 * choose what is visible from `stepIndex` or from a typed `payload`.
 * Give every direct child of <SceneLayer> a `key` (the entity id) and do not wrap children in fragments.
 * Entities that should persist keep the same id and position; only add, relabel or emphasize.
 */
export function Scene(props: SceneProps) {
  void props
  return <SceneLayer>{null}</SceneLayer>
}
