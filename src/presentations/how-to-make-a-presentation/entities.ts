/**
 * Entity namespace and layout for the sample. Every entity has ONE rect that never changes
 * after it enters: persisting entities keep position and size across all nine steps; only
 * label / emphasis / state may change. `step` is the 1-based step that introduces the entity.
 *
 * Canvas 880 x 380 (x right, y down). Coordinates table (x, y, w, h):
 *
 *   id              kind    step  x    y    w    h     notes
 *   prompt          label   1     150  20   210  30    bubble above `you`
 *   you             box     1     150  58   120  56    conversation row, left
 *   skill           box     2     610  58   120  56    conversation row, right
 *   convo-arrow     arrow   2     (274,86) <-> (606,86)  two-way, mid-height of the row
 *   question        chip    2     398  54   84   24    above the arrow (bottom 78 < line 86)
 *   tray            box     3     24   160  832  140   unframed band: no border, tint only
 *   card-1          box     3     40   172  112  104   slots are 172 apart (112 card + 60 gap)
 *   card-2          box     4     212  172  112  104
 *   card-3          box     4     384  172  112  104
 *   link-1-2        arrow   4     (156,224) -> (208,224)  in the 60px gap
 *   morph-1-2       label   4     152  200  60   18    "what morphs", on the link
 *   link-2-3        arrow   4     (328,224) -> (380,224)
 *   morph-2-3       label   4     324  200  60   18
 *   ghost-card      box     5     556  172  112  104   dashed (slot 4)
 *   link-3-ghost    arrow   5     (500,224) -> (552,224)
 *   depth           chip    5     150  114  120  26    docked: top edge == bottom edge of `you`
 *   kit-socket      box     6     340  300  200  50    top edge == tray bottom (160+140)
 *   verify          box     7     728  172  112  104   same row/size as cards (slot 5)
 *   link-ghost-verify arrow 7     (672,224) -> (724,224)
 *   verify-pass     chip    7     818  158  30   30    green check on the verify node's corner
 *   modify-arc      arrow   8     (440,90) -> (440,163)  from the conversation arrow into the route
 *   modify-label    label   8     450  112  96   18
 *   edited-flag     emphasis 8    379  167  122  114   around card-3 (x 384..496, y 172..276)
 *   outer-frame     frame   9     6    6    868  368   encloses everything (content spans 24..856 x 20..350)
 */

export const NS = 'how-to-make-a-presentation'

export type EntityKind = 'box' | 'label' | 'symbol-chip' | 'arrow' | 'frame' | 'emphasis'

export interface EntityRect {
  x: number
  y: number
  w: number
  h: number
}

export interface EntitySpec extends EntityRect {
  id: string
  kind: EntityKind
  /** 1-based step that introduces the entity. */
  step: number
}

export interface ArrowSpec {
  id: string
  step: number
  from: readonly [number, number]
  to: readonly [number, number]
  twoWay?: boolean
}

const e = (id: string, kind: EntityKind, step: number, x: number, y: number, w: number, h: number): EntitySpec => ({
  id: `${NS}/${id}`,
  kind,
  step,
  x,
  y,
  w,
  h,
})

export const ID = {
  prompt: `${NS}/prompt`,
  you: `${NS}/you`,
  skill: `${NS}/skill`,
  convoArrow: `${NS}/convo-arrow`,
  question: `${NS}/question`,
  tray: `${NS}/tray`,
  card1: `${NS}/card-1`,
  card2: `${NS}/card-2`,
  card3: `${NS}/card-3`,
  link12: `${NS}/link-1-2`,
  morph12: `${NS}/morph-1-2`,
  link23: `${NS}/link-2-3`,
  morph23: `${NS}/morph-2-3`,
  ghost: `${NS}/ghost-card`,
  link3Ghost: `${NS}/link-3-ghost`,
  depth: `${NS}/depth`,
  kitSocket: `${NS}/kit-socket`,
  verify: `${NS}/verify`,
  linkGhostVerify: `${NS}/link-ghost-verify`,
  verifyPass: `${NS}/verify-pass`,
  modifyArc: `${NS}/modify-arc`,
  modifyLabel: `${NS}/modify-label`,
  editedFlag: `${NS}/edited-flag`,
  outerFrame: `${NS}/outer-frame`,
} as const

/** Rect entities (everything but arrows), keyed by short name. */
export const RECTS = {
  prompt: e('prompt', 'label', 1, 150, 20, 210, 30),
  you: e('you', 'box', 1, 150, 58, 120, 56),
  skill: e('skill', 'box', 2, 610, 58, 120, 56),
  question: e('question', 'symbol-chip', 2, 398, 54, 84, 24),
  tray: e('tray', 'box', 3, 24, 160, 832, 140),
  card1: e('card-1', 'box', 3, 40, 172, 112, 104),
  card2: e('card-2', 'box', 4, 212, 172, 112, 104),
  card3: e('card-3', 'box', 4, 384, 172, 112, 104),
  morph12: e('morph-1-2', 'label', 4, 152, 200, 60, 18),
  morph23: e('morph-2-3', 'label', 4, 324, 200, 60, 18),
  ghost: e('ghost-card', 'box', 5, 556, 172, 112, 104),
  depth: e('depth', 'symbol-chip', 5, 150, 114, 120, 26),
  kitSocket: e('kit-socket', 'box', 6, 340, 300, 200, 50),
  verify: e('verify', 'box', 7, 728, 172, 112, 104),
  verifyPass: e('verify-pass', 'symbol-chip', 7, 818, 158, 30, 30),
  modifyLabel: e('modify-label', 'label', 8, 450, 112, 96, 18),
  editedFlag: e('edited-flag', 'emphasis', 8, 379, 167, 122, 114),
  outerFrame: e('outer-frame', 'frame', 9, 6, 6, 868, 368),
} as const

const a = (
  id: string,
  step: number,
  from: readonly [number, number],
  to: readonly [number, number],
  twoWay = false,
): ArrowSpec => ({ id: `${NS}/${id}`, step, from, to, twoWay })

export const ARROWS = {
  convo: a('convo-arrow', 2, [274, 86], [606, 86], true),
  link12: a('link-1-2', 4, [156, 224], [208, 224]),
  link23: a('link-2-3', 4, [328, 224], [380, 224]),
  link3Ghost: a('link-3-ghost', 5, [500, 224], [552, 224]),
  linkGhostVerify: a('link-ghost-verify', 7, [672, 224], [724, 224]),
  modify: a('modify-arc', 8, [440, 90], [440, 163]),
} as const

export const ALL_RECTS: readonly EntitySpec[] = Object.values(RECTS)
export const ALL_ARROWS: readonly ArrowSpec[] = Object.values(ARROWS)
export const ALL_IDS: readonly string[] = [...ALL_RECTS.map((r) => r.id), ...ALL_ARROWS.map((r) => r.id)]

/** Entity ids that must be on screen at a 1-based step (everything introduced at or before it). */
export function idsAtStep(step: number): string[] {
  return ALL_IDS.filter((id) => {
    const spec = [...ALL_RECTS, ...ALL_ARROWS].find((s) => s.id === id)
    return spec !== undefined && spec.step <= step
  })
}

/** Cards in tray order (distinct stable ids). */
export const CARD_IDS = [ID.card1, ID.card2, ID.card3] as const
