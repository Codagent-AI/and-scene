import { E, grow, type SampleState } from '../entities.ts'

// Each step's payload extends the previous one; nothing already on screen is removed.
const s1 = grow(null, [E.you, E.prompt])
const s2 = grow(s1, [E.skill, E.conversation, E.question])
const s3 = grow(s2, [E.tray, E.card1, E.link1])
const s4 = grow(s3, [E.card2, E.card3, E.card4, E.link2, E.link3, E.link4, E.morph1, E.morph2, E.morph3])
const s5 = grow(s4, [E.ghost, E.depth])
const s6 = grow(s5, [E.socket, E.plug])
const s7 = grow(s6, [E.verify, E.verifyLink, E.pass])
const s8 = grow(s7, [E.modify, E.editedRing, E.edited])
const s9 = grow(s8, [E.frame, E.frameLabel])

export const PAYLOADS: SampleState[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9]
