export type ReferenceCard = { id: string; title: string; detail: string }

export type ReferencePayload = {
  prompt: boolean
  skill: boolean
  tray: boolean
  cards: ReferenceCard[]
  ghost: boolean
  depth: boolean
  kit: boolean
  verify: boolean
  modify: boolean
  reveal: boolean
}
