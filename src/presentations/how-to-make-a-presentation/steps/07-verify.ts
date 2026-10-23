import type { Step } from '../../../presentation-kit'
import { pass, verify, verifyLabel, verifyLink } from '../entities'
import { SampleScene } from '../Scene'
import type { SamplePayload } from '../types'
import { entities as previous } from './06-assemble'

export const entities = [...previous, verifyLink, verify, verifyLabel, pass]

export const step: Step<SamplePayload> = {
  id: 'it-checks-its-own-work',
  era: 'the build',
  title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  groupKey: 'scene',
  Scene: SampleScene,
  payload: { entities },
}
