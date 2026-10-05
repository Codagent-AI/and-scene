import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile, stat } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temp = await mkdtemp(path.join(tmpdir(), 'and-scene-inspection-'))
const run = (cmd, args, options = {}) => spawnSync(cmd, args, { cwd: temp, encoding: 'utf8', ...options })
try {
  await cp(root, temp, { recursive: true, filter: source => !/(^|\/)(node_modules|\.git|dist|artifacts|validator_logs)(\/|$)/.test(path.relative(root, source)) })
  await symlink(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir')
  const fixture = path.join(temp, 'src/presentations/controlled-inspection')
  await mkdir(fixture, { recursive: true })
  await writeFile(path.join(temp, 'src/presentations/index.ts'), `import type { ComponentType } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly PresentationEntry[] = [{ slug: 'controlled-inspection', title: 'Controlled inspection fixture', load: () => import('./controlled-inspection/Talk') }]
`)
  await writeFile(path.join(fixture, 'Talk.tsx'), `import { Presentation, SceneLayer } from '../../presentation-kit'
import './fixture.css'
function Scene({ stepIndex }: { stepIndex: number }) {
  return <SceneLayer>{stepIndex === 0 && <><div className="collision-a">collision alpha</div><div className="collision-b">collision beta</div></>}{stepIndex === 1 && <div className="allowed" data-presentation-allow-overlap=""><span>intentional</span><span>overlap</span></div>}</SceneLayer>
}
const steps = [{ id: 'one', era: 'fixture', title: 'Fixture one', caption: 'First fixture step', payload: {}, Scene }, { id: 'two', era: 'fixture', title: 'Fixture two', caption: 'Second fixture step', payload: {}, Scene }]
export default function Talk() { return <Presentation title="Fixture" steps={steps} /> }
`)
  await writeFile(path.join(fixture, 'fixture.css'), `.collision-a,.collision-b{position:absolute;left:100px;top:100px;width:150px;height:50px}.collision-a{z-index:2}.allowed{position:absolute;left:300px;top:100px;width:120px;height:50px}.allowed span{position:absolute;left:0;top:0}`)
  const started = Date.now()
  const inspect = run(process.execPath, ['scripts/inspect-presentation.mjs', 'controlled-inspection'], { env: { ...process.env, PORT: '4291' } })
  const output = `${inspect.stdout}\n${inspect.stderr}`
  assert.equal(inspect.status, 0, output)
  assert.match(output, /Captured 2 settled steps/)
  assert.match(output, /Advisory: step 0: overlap:/, 'unmarked collision should be reported at its step')
  assert.match(output, /Advisory: step 1: progress: active state looks like inactive controls/)
  assert.match(output, /Advisory: step 0: attribution: link is browser-default or undersized/)
  assert.doesNotMatch(output, /Advisory: step 1: overlap:/, 'intentional overlap subtree should suppress its collision warning')
  const artifacts = path.join(temp, 'artifacts/inspection/controlled-inspection')
  const first = await stat(path.join(artifacts, 'step-01.png'))
  const second = await stat(path.join(artifacts, 'step-02.png'))
  assert.ok(first.size > 1000 && second.size > 1000, 'one non-empty screenshot should be written for each step')
  assert.ok(second.mtimeMs - first.mtimeMs >= 700, 'the configured settle wait should separate captures')
  assert.ok(Date.now() - started >= 1600, 'the inspector should wait for both steps to settle')
  console.log('INT-002 passed: controlled screenshots, settling, overlap exemption, collision, active-state, and attribution diagnostics.')
} finally {
  await rm(temp, { recursive: true, force: true })
}
