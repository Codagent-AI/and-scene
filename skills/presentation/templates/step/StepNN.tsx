import { Appear, Box, Label, SceneLayer } from '../../../presentation-kit'
import { E } from '../entities'

/**
 * Template for one step's scene. Copy to steps/Step<NN>.tsx and add a Step object to
 * steps/index.ts. Entities that persisted from the previous step render again with the
 * same ids and no <Appear> so they morph or stay put; newcomers wrap in <Appear>.
 * Keep every `key` unique per entity and add one `E` id per entity in entities.ts.
 */
export function Scene__NN__() {
  return (
    <SceneLayer>
      <Appear key={E.__ENTITY__} className="__SLUG__-slot __SLUG__-slot-__ENTITY__">
        <Box id={E.__ENTITY__}>
          <Label id={`${E.__ENTITY__}:label`}>__LABEL__</Label>
        </Box>
      </Appear>
    </SceneLayer>
  )
}

/*
 * Matching entry for steps/index.ts:
 * {
 *   id: '__STEP_ID__',
 *   era: '__ERA__',            // consecutive equal eras form one table-of-contents entry
 *   title: '__STEP_TITLE__',   // present-mode headline
 *   caption: '__CAPTION__',    // browse-mode sentence
 *   groupKey: '__GROUP__',     // optional: reuse one scene instance across steps
 *   Scene: Scene__NN__,
 *   payload: undefined,
 * },
 */
