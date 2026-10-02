export const entity = {
  you: 'howto-you', skill: 'howto-skill', prompt: 'howto-prompt', question: 'howto-question',
  conversation: 'howto-conversation', tray: 'howto-tray', kit: 'howto-kit', verify: 'howto-verify',
  modify: 'howto-modify', frame: 'howto-frame',
} as const

export const stepCard = (index: number) => `howto-step-${index}`
