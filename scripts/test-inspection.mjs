import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const project = resolve(new URL('..', import.meta.url).pathname)
const temp = await mkdtemp(join(tmpdir(), 'and-scene-inspection-'))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const files = ['index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'src', 'scripts', 'public']
const fixture = `import { Presentation, Box, Label, SceneLayer } from '../../presentation-kit'
import './style.css'
const steps = [0, 1].map((index) => ({ id: 'fixture-' + index, era: 'Fixture ' + index, title: 'Fixture ' + index, caption: 'Controlled visual diagnostics.', groupKey: 'fixture-scene', Scene: ({ payload }: { payload: number }) => <SceneLayer>
  <Box className="collision-a" style={{ left: 100, top: 100, width: 150, height: 60 }}><Label>unmarked-alpha</Label></Box>
  <Box className="collision-b" style={{ left: 120, top: 110, width: 150, height: 60 }}><Label>unmarked-beta</Label></Box>
  <SceneLayer data-allow-overlap="">
    <Box className="intent-a" style={{ left: 400, top: 100, width: 120, height: 60 }}><Label>allowed-alpha</Label></Box>
    <Box className="intent-b" style={{ left: 420, top: 110, width: 120, height: 60 }}><Label>allowed-beta</Label></Box>
  </SceneLayer>
  <span>{payload}</span>
</SceneLayer>, payload: index }))
export default function Talk() { return <Presentation title="Inspection fixture" steps={steps} initialMode="browse" attribution={{ href: 'https://example.test' }} /> }
`
const style = `.collision-a,.collision-b,.intent-a,.intent-b { position:absolute; display:grid;place-items:center;color:#111;background:#ddd;border:1px solid #222 }
.presentation-progress-item { color:rgb(10,10,10);background:rgb(100,100,100);border-color:rgb(1,1,1);opacity:1 }
.presentation-progress-item[aria-current="step"] { color:rgb(10,10,10);background:rgb(100,100,100);border-color:rgb(1,1,1);opacity:1 }`

function run(target, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(npm, args, { cwd: target, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('error', reject)
    child.once('exit', (code) => resolveRun({ code: code ?? 1, output }))
  })
}

try {
  const target = join(temp, 'project')
  await mkdir(target)
  for (const file of files) await cp(join(project, file), join(target, file), { recursive: true })
  await symlink(join(project, 'node_modules'), join(target, 'node_modules'), 'junction')
  const presentation = join(target, 'src/presentations/inspection-fixture')
  await mkdir(presentation, { recursive: true })
  await writeFile(join(presentation, 'Talk.tsx'), fixture)
  await writeFile(join(presentation, 'style.css'), style)
  const registryPath = join(target, 'src/presentations/index.ts')
  const registry = await readFile(registryPath, 'utf8')
  await writeFile(registryPath, registry.replace('export const presentations:', "export const presentations:").replace(/\n\]/, "\n  { slug: 'inspection-fixture', title: 'Inspection fixture', load: () => import('./inspection-fixture/Talk') },\n]"))
  const build = await run(target, ['run', 'build'])
  if (build.code !== 0) throw new Error(`fixture build failed\n${build.output}`)
  const started = Date.now()
  const inspection = await run(target, ['run', 'inspect', '--', 'inspection-fixture'])
  if (inspection.code !== 0) throw new Error(`inspection failed\n${inspection.output}`)
  const elapsed = Date.now() - started
  for (const expected of [
    /WARN step 1: possible unmarked visible text\/chrome overlap:.*unmarked-alpha.*unmarked-beta/s,
    /WARN step 1: active progress and table of contents state may be indistinct/,
    /WARN step 1: attribution missing or unpolished/,
    /PASS: captured 2 settled screenshots/,
  ]) if (!expected.test(inspection.output)) throw new Error(`inspection fixture missed ${expected}\n${inspection.output}`)
  if (/allowed-alpha.*allowed-beta/s.test(inspection.output)) throw new Error(`explicit overlap exemption was ignored\n${inspection.output}`)
  if (elapsed < 1_700) throw new Error(`screenshots completed before both 900ms settle intervals (${elapsed}ms)`)
  const screenshots = await readdir(join(target, 'artifacts/inspect/inspection-fixture'))
  if (screenshots.filter((name) => name.endsWith('.png')).length !== 2) throw new Error(`expected two per-step screenshots, found ${screenshots.join(', ')}`)
  console.log('PASS: screenshots settle, warnings identify the fixture step, and allowed overlap is exempt')
} finally {
  await rm(temp, { recursive: true, force: true })
}
