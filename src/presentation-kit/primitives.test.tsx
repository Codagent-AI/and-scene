import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Label } from './nodes/Label'
import { SymbolChip } from './nodes/SymbolChip'
import { Box } from './nodes/Box'
import { Arrow } from './nodes/Arrow'
import { Frame } from './nodes/Frame'
import { Emphasis } from './nodes/Emphasis'
import { Appear } from './nodes/Appear'
import { SceneLayer } from './nodes/SceneLayer'

describe('primitive identity and styling hooks', () => {
 it('renders hooks and passes class, data, and inline style through each primitive', () => {
  const { container } = render(<>
   <Box layoutId="box" className="custom" data-probe="box" style={{ left: 12 }}>box</Box>
   <Label layoutId="label" className="custom" data-probe="label" style={{ left: 13 }}>label</Label>
   <Arrow layoutId="arrow" className="custom" data-probe="arrow" style={{ left: 14 }}>arrow</Arrow>
   <Frame layoutId="frame" className="custom" data-probe="frame" style={{ left: 15 }}>frame</Frame>
   <Emphasis layoutId="emphasis" className="custom" data-probe="emphasis" style={{ left: 16 }}>emphasis</Emphasis>
   <SymbolChip layoutId="symbol" className="custom" data-probe="symbol" style={{ left: 17 }}>symbol</SymbolChip>
   <Appear className="custom" data-probe="appear" style={{ left: 18 }}>appear</Appear>
   <SceneLayer className="custom" data-probe="layer" style={{ left: 19 }} allowOverlap>layer</SceneLayer>
  </>)
  const hooks = ['box', 'label', 'arrow', 'frame', 'emphasis', 'symbol-chip', 'appear', 'scene-layer']
  for (const hook of hooks) {
   const element = container.querySelector(`[data-presentation-${hook}]`)
   expect(element).toBeTruthy()
   expect(element?.classList.contains('custom')).toBe(true)
   expect(element?.getAttribute('data-probe')).toBeTruthy()
   expect(element?.getAttribute('style')).toContain('left:')
  }
  expect(container.querySelector('[data-presentation-scene-layer]')?.hasAttribute('data-presentation-allow-overlap')).toBe(true)
 })
})
