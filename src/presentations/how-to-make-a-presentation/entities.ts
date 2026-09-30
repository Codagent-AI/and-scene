/** Stable, presentation-local layout identities for the reference scene. */
const prefix = 'how-to-make-a-presentation'

export const entities = {
  you: `${prefix}:you`,
  prompt: `${prefix}:prompt`,
  skill: `${prefix}:skill`,
  conversationLink: `${prefix}:conversation-link`,
  question: `${prefix}:question`,
  tray: `${prefix}:tray`,
  stepOne: `${prefix}:step-one`,
  stepTwo: `${prefix}:step-two`,
  stepThree: `${prefix}:step-three`,
  stepFour: `${prefix}:step-four`,
  ghostStep: `${prefix}:ghost-step`,
  depthControl: `${prefix}:depth-control`,
  sceneKit: `${prefix}:scene-kit`,
  verify: `${prefix}:verify`,
  verifyLink: `${prefix}:verify-link`,
  pass: `${prefix}:pass`,
  modifyArc: `${prefix}:modify-arc`,
  editedFlag: `${prefix}:edited-flag`,
  reveal: `${prefix}:reveal`,
} as const
