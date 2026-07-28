export interface CardData {
  id: string
  label: string
  ghost?: boolean
  flagged?: boolean
}

/**
 * One continuously evolving scene: every field below is additive across the
 * nine steps (nothing is ever removed or rearranged), so each step's payload
 * is the previous step's payload plus one more thing becoming visible.
 */
export interface Payload {
  showConversation: boolean
  showSkillNode: boolean
  showQuestionChip: boolean
  cards: CardData[]
  showDepthControl: boolean
  showSceneKit: boolean
  showVerify: boolean
  verifyPassed: boolean
  showModifyArc: boolean
  showReveal: boolean
}
