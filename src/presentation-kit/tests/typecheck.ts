// Compile-time contract checks, type-checked by `npm run build`. Each @ts-expect-error
// line must fail to compile, so an erased or loosened contract breaks the build.
import { createElement, type ReactElement } from 'react'
import { Presentation } from '../Presentation'
import type { SceneComponent, SceneProps, Step } from '../types'

interface Payload {
  count: number
  tags: readonly string[]
}

const Scene: SceneComponent<Payload> = ({ payload }: SceneProps<Payload>) => createElement('p', null, payload.count)

const complete: Step<Payload> = {
  id: 'one',
  era: 'era',
  title: 'Title',
  caption: 'Caption',
  groupKey: 'group',
  scene: Scene,
  payload: { count: 1, tags: ['a'] },
}

// @ts-expect-error id is required
export const missingId: Step<Payload> = { era: 'era', title: 'T', caption: 'C', groupKey: 'g', scene: Scene, payload: { count: 1, tags: [] } }
// @ts-expect-error era is required
export const missingEra: Step<Payload> = { id: 'id', title: 'T', caption: 'C', groupKey: 'g', scene: Scene, payload: { count: 1, tags: [] } }
// @ts-expect-error title is required
export const missingTitle: Step<Payload> = { id: 'id', era: 'era', caption: 'C', groupKey: 'g', scene: Scene, payload: { count: 1, tags: [] } }
// @ts-expect-error caption is required
export const missingCaption: Step<Payload> = { id: 'id', era: 'era', title: 'T', groupKey: 'g', scene: Scene, payload: { count: 1, tags: [] } }
// @ts-expect-error groupKey is required
export const missingGroup: Step<Payload> = { id: 'id', era: 'era', title: 'T', caption: 'C', scene: Scene, payload: { count: 1, tags: [] } }
// @ts-expect-error scene is required
export const missingScene: Step<Payload> = { id: 'id', era: 'era', title: 'T', caption: 'C', groupKey: 'g', payload: { count: 1, tags: [] } }
// @ts-expect-error payload is required
export const missingPayload: Step<Payload> = { id: 'id', era: 'era', title: 'T', caption: 'C', groupKey: 'g', scene: Scene }
// @ts-expect-error a wrongly typed payload field is rejected
export const wrongPayload: Step<Payload> = { ...complete, payload: { count: 'many', tags: [] } }

// A typed grouped payload passes through <Presentation> without casts.
const steps: Step<Payload>[] = [complete]
export const typed: ReactElement = createElement(Presentation<Payload>, { steps, title: 'Typed' })
