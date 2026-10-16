/** Stable `layoutId` namespace for this presentation's entities. */
export const E = {
  you: 'htmp-you',
  prompt: 'htmp-prompt',
  skill: 'htmp-skill',
  question: 'htmp-question',
  control: 'htmp-control',
  rail: 'htmp-rail',
  ghost: 'htmp-ghost',
  socket: 'htmp-socket',
  verify: 'htmp-verify',
  frame: 'htmp-frame',
  card: (n: number) => `htmp-card-${n}`,
  link: (n: number) => `htmp-link-${n}`,
} as const

/** Canvas geometry of the step-card tray (880 × 380 design canvas). */
export const TRAY = { x0: 24, pitch: 148, y: 126, w: 92, h: 120 } as const

export const slotX = (slot: number): number => TRAY.x0 + slot * TRAY.pitch
