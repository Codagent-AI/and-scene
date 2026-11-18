import { afterAll, describe, expect, it } from 'vitest'
import { cp, readFile, writeFile, mkdir, mkdtemp, rm, readdir, symlink } from 'node:fs/promises'
import { resolve, join, relative } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const exec = promisify(execFile)
const root = process.cwd()
const work = resolve(root, '.work/integration')
await mkdir(work, { recursive: true })
const fixtures = []
const read = path => readFile(path, 'utf8')
async function run(dir, args, name, cwd = dir) {
  let result
  try { const { stdout, stderr } = await exec('npm', ['--prefix', dir, ...args], { cwd, timeout: 180000, maxBuffer: 8 * 1024 * 1024 }); result = { code: 0, output: stdout + stderr } }
  catch (error) { result = { code: error.code, output: (error.stdout ?? '') + (error.stderr ?? '') } }
  await writeFile(join(work, `${name}.log`), result.output)
  return result
}
async function fixture(name, source = root, install = false) {
  const dir = await mkdtemp(join(work, `${name}-`)); fixtures.push(dir)
  for (const entry of await readdir(source)) {
    if (['node_modules', '.git', '.work', 'dist', 'artifacts', 'openspec'].includes(entry)) continue
    await cp(join(source, entry), join(dir, entry), { recursive: true, filter: path => !relative(source, path).split('/').some(p => ['node_modules', '.git', '.work', 'dist', 'artifacts', 'openspec'].includes(p)) })
  }
  if (!install) await symlink(resolve(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
  return dir
}
async function change(dir, file, transform) { const path = join(dir, file); await writeFile(path, transform(await read(path))) }
async function files(dir, prefix = '') {
  return (await Promise.all((await readdir(join(dir, prefix), { withFileTypes: true })).map(e => e.isDirectory() ? files(dir, join(prefix, e.name)) : join(prefix, e.name)))).flat().sort()
}
function assertCleanPreview(output) {
  const started = [...output.matchAll(/preview http:\/\/127\.0\.0\.1:\d+ pid=(\d+)/g)].map(m => m[1])
  for (const pid of started) { expect(output).toContain(`preview stopped pid=${pid}`); expect(() => process.kill(Number(pid), 0)).toThrow() }
}
afterAll(async () => { for (const dir of fixtures) await rm(dir, { recursive: true, force: true }) })
describe('production contracts', () => {
  it('INT-001 materializes an independent complete style-neutral bootstrap with kit and script parity', async () => {
    const template = resolve(root, 'skills/presentation/templates/bootstrap')
    const dir = await fixture('bootstrap', template, true)
    const install = await run(dir, ['ci'], 'INT-001-install', work)
    expect(install.code, install.output).toBe(0)
    const pkg = JSON.parse(await read(join(dir, 'package.json')))
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[dep]).toBeTruthy()
    for (const dep of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'globals', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']) expect(pkg.devDependencies[dep]).toBeTruthy()
    expect(JSON.stringify(pkg)).not.toMatch(/tailwind/i)
    for (const file of await files(resolve(root, 'src/presentation-kit'))) expect(await read(join(dir, 'src/presentation-kit', file))).toBe(await read(resolve(root, 'src/presentation-kit', file)))
    for (const file of await files(resolve(root, 'scripts'))) expect(await read(join(dir, 'scripts', file))).toBe(await read(resolve(root, 'scripts', file)))
    const kit = (await Promise.all((await files(join(dir, 'src/presentation-kit'))).map(file => read(join(dir, 'src/presentation-kit', file))))).join('\n')
    expect(kit).not.toMatch(/#[\da-f]{3,8}\b|fontFamily:|boxShadow:|borderRadius:|backgroundColor:/i)
    expect(await read(join(dir, 'src/index.css'))).not.toMatch(/color:|font:|border:|padding:|--[\w-]+:/)
    expect(await read(join(dir, 'src/presentations/index.ts'))).toContain("slug: 'starter'")
    const verification = await run(dir, ['run', 'verify'], 'INT-001-verify', work)
    expect(verification.code, verification.output).toBe(0); expect(verification.output).toContain('PASS render step 0/1'); expect(verification.output).toContain('PASS verification'); assertCleanPreview(verification.output)
  })
  it('INT-002 captures every settled step and reports only unexempt collisions plus chrome defects', async () => {
    const dir = await fixture('inspection')
    await mkdir(join(dir, 'src/presentations/diagnostic'), { recursive: true })
    await writeFile(join(dir, 'src/presentations/index.ts'), `import type { ComponentType } from 'react'\nexport interface Registration { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }\nexport const presentations: readonly Registration[] = [{ slug: 'diagnostic', title: 'Diagnostic', load: () => import('./diagnostic/Talk') }]\n`)
    await writeFile(join(dir, 'src/presentations/diagnostic/Talk.tsx'), `import { Presentation } from '../../presentation-kit'\nimport type { SceneProps, Step } from '../../presentation-kit'\nimport './style.css'\nfunction Scene({ payload }: SceneProps<number>) { return <><div style={{ position: 'absolute', left: 50, top: 100 }}><span>unmarked alpha {payload}</span></div><div style={{ position: 'absolute', left: 50, top: 100 }}><span>unmarked beta</span></div><div data-presentation-allow-overlap="" style={{ position: 'absolute', left: 400, top: 100 }}><span>allowed alpha</span><span style={{ position: 'absolute', left: 0 }}>allowed beta</span></div></> }\nconst steps: Step<number>[] = [0,1,2,3].map(i => ({ id: String(i), era: 'era'+i, title: 'Diagnostic '+i, caption: 'Caption '+i, Scene, payload: i, groupKey: 'same' }))\nexport default function Talk() { return <Presentation steps={steps} title="Diagnostic" /> }`)
    await writeFile(join(dir, 'src/presentations/diagnostic/style.css'), '[data-step-index="0"] [data-presentation-attribution] a { font-size: 8px; } [data-step-index="2"] [data-presentation-attribution] { display: none; } [data-step-index="3"] [data-presentation-attribution] a { font-size: 14px; color: #333; text-decoration: none; } [data-step-index="3"] [data-presentation-active="true"] { background: #163d25; color: white; font-weight: 700; }')
    const output = await run(dir, ['run', 'inspect', '--', 'diagnostic', '--settle', '950'], 'INT-002-inspect')
    expect(output.code, output.output).toBe(0)
    const artifactDir = join(dir, 'artifacts/inspection/diagnostic/1440x900')
    const report = JSON.parse(await read(join(artifactDir, 'report.json')))
    expect(report).toHaveLength(4); expect((await readdir(artifactDir)).filter(p => p.endsWith('.png')).sort()).toEqual(['step-01.png', 'step-02.png', 'step-03.png', 'step-04.png'])
    for (const row of report) { const png = await readFile(join(artifactDir, row.screenshot)); expect([...png.subarray(0, 8)]).toEqual([137,80,78,71,13,10,26,10]); expect(row.settle).toBe(950); expect(row.warnings.join('\n')).toContain('unmarked alpha'); expect(row.warnings.join('\n')).not.toContain('allowed alpha'); if (row.index < 3) { expect(row.warnings.join('\n')).toContain('indistinct active progress'); expect(row.warnings.join('\n')).toContain('indistinct active toc') } else { expect(row.warnings.join('\n')).not.toContain('indistinct active'); expect(row.warnings.join('\n')).not.toContain('attribution') } if (row.index < 2) expect(row.warnings.join('\n')).toContain('unpolished attribution'); if (row.index === 2) expect(row.warnings.join('\n')).toContain('missing attribution') }
    expect(report[1].capturedAt - report[0].capturedAt).toBeGreaterThanOrEqual(950)
    expect(output.output).toContain('ADVISORY step 0'); expect(output.output).toContain('ADVISORY step 1'); expect(output.output).toContain('not a visual pass/fail'); assertCleanPreview(output.output)
    // Keep fixture artifacts inside the test's own ignored results, never in source.
    await cp(artifactDir, join(work, 'INT-002-artifacts'), { recursive: true })
  })
  it('E2E-001 reference passes the public production verification gate', async () => {
    const dir = await fixture('reference')
    const result = await run(dir, ['run', 'verify'], 'E2E-001')
    expect(result.code, result.output).toBe(0)
    for (let i = 0; i < 9; i++) expect(result.output).toContain(`PASS render step ${i}/8`)
    expect(result.output).toContain('PASS verification: build, registration, render'); expect(result.output).toContain('http://127.0.0.1:'); expect(result.output).not.toContain('localhost'); assertCleanPreview(result.output)
  })
  const cases = [
    ['build', async dir => change(dir, 'src/main.tsx', s => s + '\nconst broken: number = "type error"; console.log(broken)\n'), 'FAIL build:'],
    ['missing', async dir => { await change(dir, 'src/presentations/index.ts', s => s.replace(/export const presentations:[\s\S]+/, 'export const presentations: readonly Registration[] = []\n')); await rm(join(dir, 'src/presentations/how-to-make-a-presentation'), { recursive: true }) }, 'FAIL sample:'],
    ['order', async dir => change(dir, 'src/presentations/how-to-make-a-presentation/metadata.ts', s => s.replace(/export const metadata = ([\s\S]+) as const/, (_, json) => { const rows = JSON.parse(json); [rows[0], rows[1]] = [rows[1], rows[0]]; return 'export const metadata = ' + JSON.stringify(rows) + ' as const' })), 'FAIL sample:'],
    ['console', async dir => change(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', s => s.replace('return <SceneLayer>', 'if (payload === 2) console.error("injected console fault")\n  return <SceneLayer>')), 'step 2: console'],
    ['page', async dir => change(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', s => s.replace('return <SceneLayer>', 'if (payload === 2) setTimeout(() => { throw new Error("injected page fault") }, 50)\n  return <SceneLayer>')), 'step 2: page'],
    ['render', async dir => change(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', s => s.replace('return <SceneLayer>', 'if (payload === 2) throw new Error("injected render fault")\n  return <SceneLayer>')), 'step 2:'],
    ['transition', async dir => change(dir, 'src/presentation-kit/usePresentationNav.ts', s => s.replace('clamp(i + 1, count)', 'clamp(i, count)')), 'step 1: transition did not advance'],
  ]
  for (const [name, inject, message] of cases) it(`E2E-002 ${name} failure is actionable and cleans subprocesses`, async () => {
    const before = await read(resolve(root, 'src/presentations/how-to-make-a-presentation/metadata.ts'))
    const dir = await fixture(`fault-${name}`); await inject(dir)
    const result = await run(dir, ['run', 'verify'], `E2E-002-${name}`)
    expect(result.code, result.output).not.toBe(0); expect(result.output).toContain(message); expect(result.output).not.toContain('PASS verification:'); if (['console','page','render','transition'].includes(name)) expect(result.output).toContain('FAIL render:'); assertCleanPreview(result.output)
    expect(await read(resolve(root, 'src/presentations/how-to-make-a-presentation/metadata.ts'))).toBe(before)
  })
})
