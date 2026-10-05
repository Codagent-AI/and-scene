/** Stable identities shared by every beat of this continuously evolving scene. */
const prefix = 'how-to-make-a-presentation'
export const entity = {
  you: `${prefix}/you`, prompt: `${prefix}/prompt`, skill: `${prefix}/skill`, question: `${prefix}/question`,
  tray: `${prefix}/tray`, kit: `${prefix}/kit`, verify: `${prefix}/verify`, modify: `${prefix}/modify`,
  reveal: `${prefix}/reveal`,
  card: (index: number) => `${prefix}/step-${index}`,
} as const
