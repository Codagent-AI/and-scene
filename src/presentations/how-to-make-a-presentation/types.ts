/** Payload shared by every step: which beat of the one evolving scene is active. */
export interface DeckPayload {
  /** 1-based beat number (1–9). */
  stage: number
}
