/**
 * Every step in this presentation shares one payload type so `Presentation`
 * stays typed end to end. Add fields as the diagram grows; keep them optional
 * where a given step doesn't need them, rather than casting.
 */
export interface Payload {
  [key: string]: unknown
}
