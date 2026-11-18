import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile, stat } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const exec = promisify(execFile)
const root = process.cwd()
let scratch: string
const evidence = process.env.SCENE_EVIDENCE_DIR
async function save(name: string, output: string) { if (evidence) { await mkdir(evidence, { recursive: true }); await writeFile(join(evidence, `${name}.log`), output) } }
async function run(cwd: string, args: string[], name: string, expected = 0) {
  let output: string; let code = 0
  try { const result = await exec('npm', args, { cwd, timeout: 150000, maxBuffer: 8 * 1024 * 1024 }); output = result.stdout + result.stderr }
  catch (error) { const failure = error as { stdout: string; stderr: string; code: number }; output = (failure.stdout ?? '') + (failure.stderr ?? ''); code = failure.code }
  await save(name, output)
  expect(code, output).toBe(expected)
  return output
}
async function fixture(name: string) {
  const dir = join(scratch, name); await mkdir(dir)
  for (const path of ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'src', 'scripts']) await cp(join(root, path), join(dir, path), { recursive: true })
  await symlink(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
  return dir
}
async function change(path: string, from: string, to: string) {
  const text = await readFile(path, 'utf8'); expect(text).toContain(from); await writeFile(path, text.replace(from, to))
}
async function parity(source: string, target: string) {
  const names = await readdir(source)
  for (const name of names) {
    if ((await stat(join(source, name))).isDirectory()) await parity(join(source, name), join(target, name))
    else expect(await readFile(join(target, name), 'utf8')).toBe(await readFile(join(source, name), 'utf8'))
  }
}
function cleaned(output: string) {
  const pids = [...output.matchAll(/PREVIEW http:\/\/127\.0\.0\.1:\d+ PID (\d+)/g)].map(m => Number(m[1]))
  for (const pid of pids) { expect(output).toContain(`CLEANUP preview ${pid}`); expect(() => process.kill(pid, 0)).toThrow() }
}
beforeAll(async () => { scratch = await mkdtemp(join(tmpdir(), 'and-scene-integration-')) })
afterAll(async () => { await rm(scratch, { recursive: true, force: true }) })
describe('approved integration and end-to-end boundaries', () => {
  it('INT-001 materialized bootstrap complete neutral independent and aligned', async () => {
    const dir = join(scratch, 'bootstrap')
    // Exercise lookup from an unrelated working directory through the distributable CLI.
    await exec(process.execPath, [resolve('skills/presentation/scaffold.mjs'), dir], { cwd: scratch })
    await run(dir, ['ci', '--ignore-scripts'], 'INT-001-install')
    await run(dir, ['run', 'lint'], 'INT-001-lint')
    const output = await run(dir, ['run', 'verify'], 'INT-001-bootstrap')
    expect(output).toContain('PASS verification: example'); cleaned(output)
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[dependency]).toBeTruthy()
    for (const dependency of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', '@eslint/js', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) expect(pkg.devDependencies[dependency]).toBeTruthy()
    expect(JSON.stringify(pkg)).not.toMatch(/tailwind/i)
    await parity(join(root, 'src/presentation-kit'), join(dir, 'src/presentation-kit'))
    for (const script of ['browser-runtime.mjs', 'verify.mjs', 'inspect-presentation.mjs', 'visual-diagnostics.mjs', 'reference-outline.json']) expect(await readFile(join(dir, 'scripts', script), 'utf8')).toBe(await readFile(join(root, 'scripts', script), 'utf8'))
    const inspectNeutral = async (directory: string) => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) await inspectNeutral(path)
        else expect(await readFile(path, 'utf8')).not.toMatch(/#[0-9a-f]{3,8}\b|fontFamily:|backgroundColor:|boxShadow:|borderRadius:|tailwind/i)
      }
    }
    await inspectNeutral(join(dir, 'src/presentation-kit'))
    expect(await readFile(join(dir, 'src/index.css'), 'utf8')).toBe('/* Host-owned styles may be added here. */\n')
    await save('INT-001-contracts', 'PASS INT-001: external-CWD scaffold; full locked install; build and registered route; required dependencies; byte parity for every kit file and runtime script; style-neutral kit and host CSS.\n')
  })
  it('INT-002 settled artifacts advisory collisions exemptions active and attribution', async () => {
    const dir = await fixture('inspection')
    await writeFile(join(dir, 'src/presentations/Diagnostic.tsx'), `import { Presentation } from '../presentation-kit/Presentation'
import type { SceneProps, Step } from '../presentation-kit/types'
function Scene({ payload }: SceneProps<number>) { return <><div style={{position:'absolute',left:100,top:100}} data-diagnostic="collision-a">COLLISION A</div><div style={{position:'absolute',left:100,top:100}} data-diagnostic="collision-b">COLLISION B</div><div data-presentation-allow-overlap style={{position:'absolute',left:300,top:200}}><span style={{position:'absolute'}}>ALLOWED A</span><span style={{position:'absolute'}}>ALLOWED B</span></div><span>{payload}</span></> }
const steps: Step<number>[] = [1,2,3].map(i=>({id:String(i),era:String(i),title:'Diagnostic '+i,caption:'Caption '+i,Scene,payload:i,groupKey:'diagnostic'}))
export default function Diagnostic(){return <><style>{'[data-presentation-attribution]{font-size:8px!important}'}</style><Presentation steps={steps} title="Diagnostic" /></>}
`)
    await writeFile(join(dir, 'src/presentations/index.ts'), "export const presentations = [{ slug: 'diagnostic', title: 'Diagnostic', load: () => import('./Diagnostic') }]\n")
    const started = Date.now()
    const output = await run(dir, ['run', 'inspect', '--', 'diagnostic'], 'INT-002-inspect')
    cleaned(output)
    expect(Date.now() - started).toBeGreaterThanOrEqual(2700)
    const folder = join(dir, 'artifacts/inspection/diagnostic/1440x900')
    const report = JSON.parse(await readFile(join(folder, 'report.json'), 'utf8'))
    expect(report).toHaveLength(3)
    for (const capture of report) {
      expect(capture.settledFor).toBeGreaterThanOrEqual(900)
      if (capture.index > 0) expect(capture.capturedAt - report[capture.index - 1].capturedAt).toBeGreaterThanOrEqual(capture.settledFor)
      const png = await readFile(join(dir, capture.file)); expect(png.subarray(1, 4).toString()).toBe('PNG'); expect(png.readUInt32BE(16)).toBe(1440); expect(png.readUInt32BE(20)).toBe(900)
      expect(capture.warnings.join('\n')).toContain('COLLISION A'); expect(capture.warnings.join('\n')).not.toContain('ALLOWED A')
      expect(capture.warnings.join('\n')).toContain('indistinct active chrome'); expect(capture.warnings.join('\n')).toContain('unpolished attribution')
      expect(output).toContain(`ADVISORY step ${capture.index}`)
    }
    await save('INT-002-contracts', 'PASS INT-002: three desktop PNGs with expected dimensions and filenames, configured >=900ms settling per step, collision identity warnings, explicit subtree exemption, active progress/ToC and attribution warnings, advisory zero exit, preview cleanup.\n')
  })
  it('E2E-001 reference production verification', async () => {
    const output = await run(root, ['run', 'verify'], 'E2E-001-reference')
    for (let i = 0; i < 9; i++) expect(output).toContain(`STEP ${i} PASS`)
    expect(output).toContain('PASS verification: how-to-make-a-presentation'); expect(output).toContain('http://127.0.0.1:'); cleaned(output)
  })
  it.each(['build', 'missing', 'order', 'console', 'page', 'render', 'transition'])('E2E-002 actionable %s failure and cleanup', async kind => {
    const dir = await fixture(`failure-${kind}`)
    const sourceBefore = await readFile(join(root, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'), 'utf8')
    if (kind === 'build') await writeFile(join(dir, 'src/broken.ts'), 'const broken: number = "no"; export { broken }\n')
    if (kind === 'missing') await writeFile(join(dir, 'src/presentations/index.ts'), 'export const presentations: {slug:string;title:string;load:()=>Promise<{default:()=>null}>}[] = []\n')
    if (kind === 'order') await change(join(dir, 'src/presentations/how-to-make-a-presentation/steps/index.ts'), 'outline.map(', '[...outline].reverse().map(')
    if (['console', 'page', 'render'].includes(kind)) {
      const effect = kind === 'console' ? "console.error('injected console failure')" : kind === 'page' ? "setTimeout(() => { throw new Error('injected page failure') }, 10)" : "throw new Error('injected render failure')"
      await change(join(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'), 'return <SceneLayer>', `if (payload === 2) { ${effect} }\n  return <SceneLayer>`)
    }
    if (kind === 'transition') await change(join(dir, 'src/presentation-kit/usePresentationNav.ts'), 'clamp(i + 1, count)', 'clamp(i, count)')
    const output = await run(dir, ['run', 'verify'], `E2E-002-${kind}`, 1)
    expect(output).toContain(`FAIL ${kind === 'build' ? 'build' : ['missing', 'order'].includes(kind) ? 'sample' : 'render'}`)
    if (['console', 'page', 'render', 'transition'].includes(kind)) expect(output).toContain('step 1')
    expect(output).not.toContain('PASS verification:'); cleaned(output)
    expect(await readFile(join(root, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'), 'utf8')).toBe(sourceBefore)
  })
})
