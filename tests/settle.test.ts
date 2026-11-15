import { it, expect, afterEach } from 'vitest'
import { settleFiniteAnimations } from '../scripts/browser-session.mjs'
function animations(list: unknown[]) { Object.defineProperty(document, 'getAnimations', { configurable: true, value: () => list }) }
afterEach(() => { delete (document as unknown as Record<string, unknown>).getAnimations })
function fake(endTime: number, playState = 'running') {
  let finish!: () => void
  const state = { playState, finished: new Promise<void>(r => { finish = () => { state.playState = 'finished'; r() } }), effect: { getComputedTiming: () => ({ endTime }) } }
  return { state, finish }
}
it('A0-2 waits for a finite running animation that outlasts the settle interval', async () => {
  const long = fake(2000), forever = fake(Infinity), done = fake(100, 'finished')
  animations([long.state, forever.state, done.state])
  let settled = false
  const run = settleFiniteAnimations(5000).then(() => { settled = true })
  await new Promise(r => setTimeout(r, 20))
  expect(settled).toBe(false)
  long.finish()
  await run
  expect(settled).toBe(true)
})
it('A0-2 gives up at the limit instead of hanging on a stuck animation', async () => {
  const stuck = fake(60000)
  animations([stuck.state])
  const started = performance.now()
  await settleFiniteAnimations(50)
  expect(performance.now() - started).toBeLessThan(1000)
})
