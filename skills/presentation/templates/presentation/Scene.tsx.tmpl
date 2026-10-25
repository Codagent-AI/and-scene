import { AnimatePresence } from 'motion/react'
import { Appear, Arrow, Box, SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'
import { E, type SceneState } from './entities.ts'

/**
 * One persistent scene for every step: steps only change the payload, so entities
 * that continue stay mounted and morph instead of being redrawn. Newcomers use Appear,
 * and AnimatePresence lets entities that leave a step animate out.
 */
export function Scene({ payload }: SceneProps<SceneState>) {
  const has = (id: string) => (payload.shown as readonly string[]).includes(id)
  const entering = (id: string) => (payload.entering as readonly string[]).includes(id)
  return (
    <SceneLayer className="scene">
      <AnimatePresence>
        {has(E.idea) ? (
          <Appear key={E.idea} id={`${E.idea}/slot`} at={{ x: 80, y: 130, w: 220, h: 100 }} enter={entering(E.idea)}>
            <Box id={E.idea} className="card" style={{ width: '100%', height: '100%' }}>
              the idea
            </Box>
          </Appear>
        ) : null}
        {has(E.detail) ? (
          <Appear key={E.detail} id={`${E.detail}/slot`} at={{ x: 580, y: 130, w: 220, h: 100 }} enter={entering(E.detail)}>
            <Box id={E.detail} className="card" style={{ width: '100%', height: '100%' }}>
              the detail
            </Box>
          </Appear>
        ) : null}
        {has(E.link) ? <Arrow key={E.link} id={E.link} className="arrow" from={{ x: 300, y: 180 }} to={{ x: 578, y: 180 }} /> : null}
      </AnimatePresence>
    </SceneLayer>
  )
}
