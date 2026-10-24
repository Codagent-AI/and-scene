/** This presentation's layoutId namespace: every on-screen entity has one stable id. */
export const E = {
  you: 'htmp-you',
  prompt: 'htmp-prompt',
  skill: 'htmp-skill',
  talk: 'htmp-talk-arrow',
  question: 'htmp-question-chip',
  tray: 'htmp-tray',
  trayLabel: 'htmp-tray-label',
  card: (n: number) => `htmp-card-${n}`,
  link: (n: number) => `htmp-link-${n}`,
  morph: (n: number) => `htmp-morph-${n}`,
  ghost: 'htmp-ghost-card',
  depth: 'htmp-depth-control',
  socket: 'htmp-scene-kit-socket',
  verify: 'htmp-verify',
  verifyChain: 'htmp-verify-chain',
  pass: 'htmp-pass-check',
  route: 'htmp-route',
  modify: 'htmp-modify-arc',
  edited: 'htmp-edited-flag',
  reveal: 'htmp-reveal-frame',
  revealLabel: 'htmp-reveal-label',
} as const

/** Entity ids visible at a given stage (1-based). Entities only accumulate. */
export function entityIdsAt(stage: number): string[] {
  const ids: string[] = []
  if (stage >= 1) ids.push(E.you, E.prompt)
  if (stage >= 2) ids.push(E.skill, E.talk, E.question)
  if (stage >= 3) ids.push(E.tray, E.trayLabel, E.card(1), E.link(1), E.morph(1))
  if (stage >= 4) ids.push(E.card(2), E.card(3), E.link(2), E.morph(2))
  if (stage >= 5) ids.push(E.ghost, E.depth)
  if (stage >= 6) ids.push(E.socket)
  if (stage >= 7) ids.push(E.verify, E.verifyChain, E.pass)
  if (stage >= 8) ids.push(E.route, E.modify, E.edited)
  if (stage >= 9) ids.push(E.reveal, E.revealLabel)
  return ids
}
