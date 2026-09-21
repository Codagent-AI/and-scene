import { ENTITY_IDS } from '../entities'

export type Payload = { label: string }

export function Scene({ payload }: { payload: Payload }) {
  return <div data-presentation-scene-layer className="scene-layer">
    <div data-presentation-box data-entity-id={ENTITY_IDS.subject} className="scene-box">{payload.label}</div>
  </div>
}
