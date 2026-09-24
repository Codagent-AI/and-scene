import { createSceneNode, type SceneNodeProps } from './createSceneNode'
export interface BoxProps extends Omit<SceneNodeProps, 'id'> { as?: 'div' | 'article' }
const BoxNode = createSceneNode('scene-box', 'data-presentation-box')
export function Box(props: BoxProps) { return <BoxNode {...props} /> }
