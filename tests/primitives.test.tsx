// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../src/presentation-kit/nodes'
afterEach(cleanup)
it('primitives expose stable hooks and author classes and coordinates',()=>{ const {container}=render(<SceneLayer><Box id="box" className="custom" style={{left:12,position:'absolute'}}>Box</Box><Label id="label">Label</Label><Arrow id="arrow">Arrow</Arrow><Frame id="frame">Frame</Frame><Emphasis id="emphasis">Emphasis</Emphasis><SymbolChip id="chip">Chip</SymbolChip></SceneLayer>); for(const kind of ['box','label','arrow','frame','emphasis','symbol-chip']) expect(container.querySelector(`[data-presentation-node="${kind}"]`)).toBeTruthy(); expect((container.querySelector('.custom') as HTMLElement).style.left).toBe('12px'); expect(container.querySelector('[data-presentation-scene-layer]')).toBeTruthy() })
