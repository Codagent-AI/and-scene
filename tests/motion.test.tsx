import { it, expect } from 'vitest'
import { Primitive } from '../src/presentation-kit/nodes/primitives'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
it('I-3 morph identities, layout projection and sequenced newcomer/exit configuration', () => {
  const node = Primitive({ id: 'entity', kind: 'box', style: { left: 40, width: 100 }, children: 'Label' })
  expect(node.props.layout).toBe(true); expect(node.props.layoutId).toBe('entity')
  expect(node.props.transition.layout.duration).toBe(LAYOUT_T)
  expect(node.props.style).toEqual({ left: 40, width: 100 })
  const appear = Appear({ children: 'New' })
  expect(appear.props.initial).toEqual({ opacity: 0 }); expect(appear.props.animate).toEqual({ opacity: 1 })
  expect(appear.props.exit).toEqual({ opacity: 0, transition: { delay: 0, duration: ENTER_T } })
  expect(appear.props.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
  expect(ENTER_DELAY).toBe(LAYOUT_T)
})
it('I-5 layers preserve absolute overlapping coordinates and authored stacking', () => {
  expect(SceneLayer({ style: { zIndex: 4, left: 12 } }).props.style).toEqual({ position: 'absolute', inset: 0, zIndex: 4, left: 12 })
  expect(Primitive({ id: 'overlap', kind: 'frame', style: { position: 'absolute', left: 12, zIndex: 9 } }).props.style).toEqual({ position: 'absolute', left: 12, zIndex: 9 })
})
