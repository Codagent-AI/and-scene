import { expect,it } from 'vitest'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Arrow } from '../src/presentation-kit/nodes/Arrow'
import { Frame } from '../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../src/presentation-kit/nodes/SymbolChip'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { ENTER_DELAY, LAYOUT_T } from '../src/presentation-kit/constants'
it('I-15 I-18 all generic nodes keep stable layout projection exit and author hooks without visual defaults',()=>{for(const Node of [Box,Label,Arrow,Frame,Emphasis,SymbolChip]){const output=Node({id:'stable',className:'authored',style:{left:31},children:'Label'});expect(output.props.layout).toBe(true);expect(output.props.layoutId).toBe('stable');expect(output.props.transition.layout).toEqual(LAYOUT_T);expect(output.props.exit.opacity).toBe(0);expect(output.props.className).toBe('authored');expect(output.props.style).toEqual({left:31});expect(Node({id:'unstyled'}).props.style).toBeUndefined()}})
it('I-15 newcomers enter after layout and departures exit without entry delay',()=>{const p=Appear({children:'new'}).props;expect(p.initial.opacity).toBe(0);expect(p.animate.opacity).toBe(1);expect(p.transition.delay).toBe(ENTER_DELAY);expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T.duration);expect(p.exit.transition.delay).toBe(0)})
it('I-17 independent layers stay absolutely positioned',()=>{const p=SceneLayer({children:'layer',style:{zIndex:2}}).props;expect(p.style).toEqual({position:'absolute',inset:0,zIndex:2})})
