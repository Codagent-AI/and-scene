export const entity = (name: string) => `how-to-make:${name}`

/** Literal geometry is shared by every beat: accumulated entities never move. */
export const positions = {
  you: { left: 88, top: 57, width: 132, height: 54 },
  prompt: { left: 276, top: 121, width: 320, height: 36 },
  skill: { left: 612, top: 57, width: 152, height: 54 },
  question: { left: 333, top: 28, width: 198, height: 27 },
  depth: { left: 81, top: 111, width: 146, height: 31 },
  tray: { left: 80, top: 179, width: 764, height: 123 },
  card1: { left: 96, top: 196, width: 133, height: 90 },
  card2: { left: 270, top: 196, width: 133, height: 90 },
  card3: { left: 444, top: 196, width: 133, height: 90 },
  ghost: { left: 615, top: 196, width: 80, height: 90 },
  socket: { left: 338, top: 302, width: 220, height: 33 },
  verify: { left: 724, top: 196, width: 109, height: 90 },
  reveal: { left: 30, top: 10, width: 822, height: 352 },
} as const
