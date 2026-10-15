/** Stable layoutId namespace for the sample's single evolving scene. */
export const E = {
  you: 'htp-you',
  prompt: 'htp-prompt',
  skill: 'htp-skill',
  askArrow: 'htp-ask-arrow',
  replyArrow: 'htp-reply-arrow',
  questionChip: 'htp-question-chip',
  tray: 'htp-tray',
  card: (i: number) => `htp-card-${i}`,
  link: (i: number) => `htp-link-${i}`,
  linkChip: (i: number) => `htp-link-chip-${i}`,
  ghost: 'htp-ghost',
  ghostLink: 'htp-ghost-link',
  depthControl: 'htp-depth-control',
  kitSocket: 'htp-kit-socket',
  verify: 'htp-verify',
  verifyLink: 'htp-verify-link',
  verifyPass: 'htp-verify-pass',
  modifyArc: 'htp-modify-arc',
  modifyChip: 'htp-modify-chip',
  editedFlag: 'htp-edited-flag',
  frame: 'htp-frame',
} as const

/** Canvas geometry (880×380) shared by every beat. */
export const SLOT = { x0: 36, pitch: 136, w: 112, top: 128, h: 100 }
export const slotX = (i: number) => SLOT.x0 + i * SLOT.pitch
/** Index of the card flagged as edited in the loop beat. */
export const EDITED_CARD = 2
