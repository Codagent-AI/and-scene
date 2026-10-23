// Stable entity namespace for one presentation. Each id is the layoutId that persists across steps.
export type EntityId = 'example-box'

export interface DiagramState {
  visible: EntityId[]
  added: EntityId[]
  emphasized: EntityId[]
}
