import { expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { AnimatePresence } from 'motion/react'
import { Appear, Box, Stage, ENTER_DELAY, type SceneProps, type Step } from '../src/presentation-kit'
function Scene({ payload }: SceneProps<boolean>) {
  return <AnimatePresence>
    <Appear key="continuing"><Box entityId="motion:continuing" className={payload ? 'emphasized' : ''} style={{ position:'absolute',left:payload?200:20,width:payload?160:80 }}>{payload?'after':'before'}</Box></Appear>
    {payload && <Appear key="new"><Box entityId="motion:new">new</Box></Appear>}
    {!payload && <Appear key="departing"><Box entityId="motion:departing">departing</Box></Appear>}
  </AnimatePresence>
}
it('I-4 I-6 real Motion introduces delayed newcomers, retains continuing entities, and fades then removes departures', async () => {
  const step: Step<boolean> = { id:'start',era:'test',title:'Motion',caption:'Motion lifecycle.',groupKey:'same',Scene,payload:false }
  const { rerender,container } = render(<Stage step={step} scale={1} />)
  const entity=(name:string)=>container.querySelector(`[data-presentation-entity="motion:${name}"]`) as HTMLElement|null
  const wrapper=(name:string)=>entity(name)?.closest('[data-presentation-appear]') as HTMLElement|null
  await waitFor(()=>expect(Number(wrapper('continuing')?.style.opacity)).toBe(1),{timeout:1800})
  const continuing=entity('continuing'), continuingWrapper=wrapper('continuing')
  const departure=wrapper('departing')!
  const began=performance.now()
  rerender(<Stage step={{...step,id:'next',payload:true}} scale={1} />)
  expect(entity('continuing')).toBe(continuing)
  expect(continuing?.style.left).toBe('200px');expect(continuing?.style.width).toBe('160px')
  expect(continuing?.textContent).toBe('after');expect(continuing?.className).toBe('emphasized')
  expect(wrapper('continuing')).toBe(continuingWrapper);expect(continuingWrapper?.style.opacity).toBe('1')
  expect(entity('new')).not.toBeNull();expect(wrapper('new')?.style.opacity).toBe('0')
  expect(entity('departing')).not.toBeNull()
  await waitFor(()=>expect(Number(departure.style.opacity)).toBeLessThan(1))
  await waitFor(()=>expect(entity('departing')).toBeNull())
  await waitFor(()=>expect(Number(wrapper('new')?.style.opacity)).toBeGreaterThan(0),{timeout:1800,interval:5})
  expect(performance.now()-began).toBeGreaterThanOrEqual(ENTER_DELAY*1000-40)
  expect(continuingWrapper?.style.opacity).toBe('1')
  await waitFor(()=>expect(wrapper('new')?.style.opacity).toBe('1'),{timeout:1800})
})
