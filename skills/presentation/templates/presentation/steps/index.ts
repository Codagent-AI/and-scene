import type { Step } from '__KIT_FROM_STEPS__'
import { Scene, type ScenePayload } from '../Scene'

/**
 * Three steps sharing one group and one Scene, so a single scene instance
 * accumulates. Replace the titles, captions and payloads with the real content.
 * Steps are ordered by array position; ids are stable.
 */
export const STEPS: readonly Step<ScenePayload>[] = [
  {
    id: 'start',
    era: 'Overview',
    title: 'Step one title',
    caption: 'Step one caption: what the first picture shows.',
    groupKey: 'scene',
    Scene,
    payload: { connected: false, focused: false },
  },
  {
    id: 'connect',
    era: 'Overview',
    title: 'Step two title',
    caption: 'Step two caption: the second entity arrives and connects.',
    groupKey: 'scene',
    Scene,
    payload: { connected: true, focused: false },
  },
  {
    id: 'focus',
    era: 'Overview',
    title: 'Step three title',
    caption: 'Step three caption: the emphasis calls out the target.',
    groupKey: 'scene',
    Scene,
    payload: { connected: true, focused: true },
  },
]
