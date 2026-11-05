import { Box, type SceneProps, type Step } from '../../../presentation-kit'
import { entities } from '../entities'
export type SceneData = { label: string }
// eslint-disable-next-line react-refresh/only-export-components
function Scene({ payload }: SceneProps<SceneData>) { return <Box id={entities.subject}>{payload.label}</Box> }
export const intro: Step<SceneData> = { id: 'intro', era: 'introduction', title: 'Introduction', caption: 'Introduce the topic.', Scene, payload: { label: 'Topic' }, groupKey: 'main' }
