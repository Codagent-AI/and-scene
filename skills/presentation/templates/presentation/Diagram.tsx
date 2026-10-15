import { SceneLayer, type SceneProps } from '../../presentation-kit'

export interface DiagramPayload {
  /** One-based step; the scene shows every entity up to and including this one. */
  step: number
}

/** The one persistent scene shared by all steps of __SLUG__; only `payload` changes between steps. */
export function Diagram({ payload }: SceneProps<DiagramPayload>) {
  return (
    <SceneLayer name="__SLUG__">
      {/* Render kit nodes (Box, Label, Arrow, Frame, Emphasis, SymbolChip) keyed by entity id from ./entities.
          Entities present in consecutive steps keep the same id so they morph; wrap newcomers in <Appear>. */}
      <span hidden>{payload.step}</span>
    </SceneLayer>
  )
}
