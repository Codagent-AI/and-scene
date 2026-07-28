/**
 * Steps 6-7 ("the build"): the scene-kit socket plugs into the tray, then a
 * verify node chains onto the row and resolves to a green pass. Shared
 * `groupKey`/`Scene` instance so the socket persists while verification adds
 * on beside it.
 */
import type { Step } from '../../../presentation-kit/types'
import { Scene, type BeatPayload } from './Scene'

const BASE: BeatPayload['visible'] = {
  you: true,
  prompt: true,
  skill: true,
  link: true,
  cardCount: 4,
  ghost: true,
  depthControl: true,
  kitSocket: false,
  verifyNode: false,
  verifyPass: false,
  modifyArc: false,
  editedCardIndex: null,
  revealFrame: false,
}

export const assemblesTheScene: Step<BeatPayload> = {
  id: 'assembles-the-scene',
  section: 'the build',
  title: 'It assembles the scene',
  caption:
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  Scene,
  groupKey: 'build',
  payload: {
    visible: { ...BASE, kitSocket: true },
    introduced: ['kitSocket'],
  },
}

export const checksItsOwnWork: Step<BeatPayload> = {
  id: 'checks-its-own-work',
  section: 'the build',
  title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  Scene,
  groupKey: 'build',
  payload: {
    visible: { ...BASE, kitSocket: true, verifyNode: true, verifyPass: true },
    introduced: ['verifyNode', 'verifyLink', 'verifyCheck'],
  },
}
