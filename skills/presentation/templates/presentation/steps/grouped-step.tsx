import type { SceneProps, Step } from '../../../presentation-kit'
import { Box, SceneLayer } from '../../../presentation-kit'
import { ENTITIES } from '../entities'

/**
 * Template for a step that is one state of an evolving diagram shared with
 * adjacent steps. Copy alongside `step.tsx` when several consecutive beats
 * should update one persistent Scene instance instead of remounting.
 *
 * Give every step in the group the same `groupKey` and `Scene`; only
 * `payload` differs between them. Define a payload type once and reuse it
 * across the whole group so `SceneProps<TPayload>` stays cast-free.
 */
interface {{PayloadTypeName}} {
  {{payloadField}}: {{payloadFieldType}}
}

function GroupedScene({ payload }: SceneProps<{{PayloadTypeName}}>) {
  return (
    <SceneLayer className="{{slug}}-scene">
      <Box layoutId={ENTITIES.{{ENTITY_KEY}}}>{payload.{{payloadField}}}</Box>
    </SceneLayer>
  )
}

export const {{stepVarName}}: Step<{{PayloadTypeName}}> = {
  id: '{{step-slug}}',
  era: '{{Era label}}',
  title: '{{Present-mode one-liner}}',
  caption: '{{Browse-mode paragraph}}',
  groupKey: '{{group-key}}',
  Scene: GroupedScene,
  payload: { {{payloadField}}: {{payloadFieldInitialValue}} },
}
