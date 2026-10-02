export const ENTITY = {
  you: 'how-to.you', skill: 'how-to.skill', conversation: 'how-to.conversation', prompt: 'how-to.prompt', question: 'how-to.question',
  tray: 'how-to.tray', kit: 'how-to.kit', verify: 'how-to.verify', modify: 'how-to.modify', reveal: 'how-to.reveal',
  partial: 'how-to.partial',
} as const

export const cardId = (index: number) => `how-to.step-${index + 1}`
