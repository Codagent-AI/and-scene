import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve('.')
const temp = await mkdtemp(join(tmpdir(), 'and-scene-inspection-'))
const app = join(temp, 'fixture')
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: app, encoding: 'utf8', timeout: 180_000 })
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with ${result.status}: ${result.error?.message ?? (result.stderr || result.stdout || '(no output)')}`)
  return `${result.stdout ?? ''}${result.stderr ?? ''}`
}
try {
  await mkdir(app, { recursive: true })
  await cp(join(root, 'src'), join(app, 'src'), { recursive: true })
  await cp(join(root, 'scripts/inspect-presentation.mjs'), join(app, 'scripts-inspect.mjs'))
  await cp(join(root, 'package.json'), join(app, 'package.json'))
  for (const file of ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) await cp(join(root, file), join(app, file))
  await symlink(join(root, 'node_modules'), join(app, 'node_modules'), 'dir')
  await mkdir(join(app, 'src/presentations/inspection-fixture'), { recursive: true })
  await writeFile(join(app, 'src/presentations/inspection-fixture/Talk.tsx'), `import { Presentation } from '../../presentation-kit/Presentation.tsx'; import { SceneLayer, Box } from '../../presentation-kit/nodes/index.ts'; import type { Step } from '../../presentation-kit/types.ts'; import './fixture.css'; function Scene() { return <SceneLayer><Box id="collision-a" style={{left:100,top:90}}>Unmarked overlap</Box><Box id="collision-b" style={{left:110,top:100}}>Collision target</Box><Box id="header-collision" style={{left:280,top:-260}}>Header collision</Box><Box id="allowed-a" data-presentation-allow-overlap="" style={{left:400,top:90}}>Marked overlap A</Box><Box id="allowed-b" style={{left:410,top:100}}>Marked overlap B</Box></SceneLayer> }; const steps: Step<number>[] = [1,2].map((value) => ({ id: String(value), era: 'test', title: 'Fixture '+value, caption: 'Inspection fixture', Scene, groupKey: 'fixture', payload: value })); export default function Talk() { return <Presentation title="Inspection fixture" steps={steps} /> }`)
  await writeFile(join(app, 'src/presentations/inspection-fixture/fixture.css'), `.presentation-progress-item[data-presentation-active="true"], .presentation-progress-item[data-presentation-active="false"], .presentation-toc-item[data-presentation-active="true"], .presentation-toc-item[data-presentation-active="false"] { color: #222; background: white; border: 1px solid #777; opacity: 1; transform: none; } .presentation-attribution { all: revert; } [data-presentation-node] { position: absolute; width: 160px; height: 60px; border: 1px solid #111; background: white; }`)
  const registry = join(app, 'src/presentations/index.ts')
  await writeFile(registry, (await readFile(registry, 'utf8')).replace('export const presentations: PresentationEntry[] = [', "export const presentations: PresentationEntry[] = [{ slug: 'inspection-fixture', title: 'Inspection fixture', load: () => import('./inspection-fixture/Talk') },"))
  run('npm', ['run', 'build'])
  const started = Date.now()
  const output = run(process.execPath, ['scripts-inspect.mjs', 'inspection-fixture'])
  if (Date.now() - started < 1600) throw new Error('Inspection did not wait for transitions to settle before capturing both steps')
  for (const required of ['visible text/chrome overlap:', 'visually indistinct', 'browser-default']) if (!output.includes(required)) throw new Error(`Expected diagnostic missing: ${required}\n${output}`)
  const screenshots = (await readdir(join(app, 'inspection'))).filter(file => file.endsWith('.png'))
  if (screenshots.length !== 2) throw new Error(`Expected two settled step screenshots, found ${screenshots.length}`)
  if (!output.includes('Header collision') || !output.includes('Inspection fixture')) throw new Error(`Header text collision was not reported\n${output}`)
  if (output.includes('Marked overlap A” with “Marked overlap B')) throw new Error('Allowed overlap was incorrectly reported')
  // Narrow-viewport pass on the real reference sample: its chrome must not collide (browse caption vs. step controls).
  const narrow = run(process.execPath, ['scripts-inspect.mjs', 'how-to-make-a-presentation', '--viewport=390x844'])
  if (narrow.includes('text/chrome overlap')) throw new Error(`Reference sample chrome collides at a phone viewport\n${narrow}`)
  const narrowShots = (await readdir(join(app, 'inspection'))).filter(file => file.includes('-390x844-') && file.endsWith('.png'))
  if (narrowShots.length !== 9) throw new Error(`Expected nine narrow-viewport screenshots, found ${narrowShots.length}`)
  for (const bad of ['--viewport=', '--viewport=wide']) {
    const rejected = spawnSync(process.execPath, ['scripts-inspect.mjs', 'how-to-make-a-presentation', bad], { cwd: app, encoding: 'utf8' })
    if (rejected.status !== 2 || !rejected.stderr.includes('Usage:')) throw new Error(`Invalid ${bad} was not rejected with a usage error (exit ${rejected.status})`)
  }
  console.log('INT-002 passed: two screenshots captured, diagnostics surfaced, and marked overlap exempted.')
} catch (error) {
  console.error(`INT-002 failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await rm(temp, { recursive: true, force: true })
}
