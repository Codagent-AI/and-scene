import { afterAll, describe, expect, it } from 'vitest'
import { cp, readFile, writeFile, mkdir, mkdtemp, rm, readdir, symlink } from 'node:fs/promises'
import { resolve, join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const exec = promisify(execFile)
const root = process.cwd()
const work = resolve(root, '.work/integration')
await mkdir(work, { recursive: true })
const fixtures = []
const excluded = new Set(['node_modules', '.git', '.work', 'dist', 'artifacts', 'openspec'])
const read = path => readFile(path, 'utf8')
async function run(dir, args, name, cwd = dir) {
  let result
  try { const { stdout, stderr } = await exec('npm', ['--prefix', dir, ...args], { cwd, env: { ...process.env, ...(args[0] === 'run' ? { NODE_ENV: 'production' } : {}) }, timeout: 180000, maxBuffer: 8 * 1024 * 1024 }); result = { code: 0, output: stdout + stderr } }
  catch (error) { result = { code: error.code, output: (error.stdout ?? '') + (error.stderr ?? '') } }
  result.output = `NODE_ENV=${args[0] === 'run' ? 'production' : process.env.NODE_ENV}\n$ npm --prefix ${dir} ${args.join(' ')}\ncwd=${cwd}\n` + result.output
  await writeFile(join(work, `${name}.log`), result.output)
  return result
}
async function fixture(name, source = root, install = false, parent = work) {
  const dir = await mkdtemp(join(parent, `${name}-`)); fixtures.push(dir)
  for (const entry of await readdir(source)) {
    if (excluded.has(entry)) continue
    await cp(join(source, entry), join(dir, entry), { recursive: true, filter: path => !relative(source, path).split('/').some(p => excluded.has(p)) })
  }
  if (!install) await symlink(resolve(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
  return dir
}
async function change(dir, file, transform) { const path = join(dir, file); await writeFile(path, transform(await read(path))) }
async function files(dir, prefix = '') {
  return (await Promise.all((await readdir(join(dir, prefix), { withFileTypes: true })).map(e => e.isDirectory() ? files(dir, join(prefix, e.name)) : join(prefix, e.name)))).flat().sort()
}
function assertCleanResources(output, expected = 1) {
  const previews = [...output.matchAll(/preview http:\/\/127\.0\.0\.1:\d+ pid=(\d+)/g)].map(m => m[1])
  const browsers = [...output.matchAll(/chromium pid=(\d+)/g)].map(m => m[1])
  expect(previews).toHaveLength(expected); expect(browsers).toHaveLength(expected)
  for (const pid of previews) expect(output).toContain(`preview stopped pid=${pid}`)
  for (const pid of browsers) expect(output).toContain(`chromium stopped pid=${pid} connected=false`)
  for (const pid of [...previews, ...browsers]) {
    try { process.kill(Number(pid), 0); throw new Error(`Process ${pid} is still alive`) }
    catch (error) { expect(error.code).toBe('ESRCH') }
  }
  console.log(`cleanup asserted: preview=${previews.length} chromium=${browsers.length} expected=${expected}`)
}
afterAll(async () => { for (const dir of fixtures) await rm(dir, { recursive: true, force: true }) })
describe('production contracts', () => {
  it('INT-001 materializes an independent complete style-neutral bootstrap with kit and script parity', async () => {
    const external = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-')); fixtures.push(external)
    expect(relative(root, external).startsWith('..')).toBe(true)
    const installedSkill = join(external, 'skill'), caller = join(external, 'caller')
    await cp(resolve(root, 'skills/presentation'), installedSkill, { recursive: true }); await mkdir(caller)
    const { stdout } = await exec(process.execPath, [join(installedSkill, 'templates.mjs'), 'bootstrap'], { cwd: caller })
    const template = stdout.trim()
    expect(template).toBe(join(installedSkill, 'templates/bootstrap/'))
    const dir = await fixture('bootstrap', template, true, external)
    expect(relative(root, dir).startsWith('..')).toBe(true)
    console.log(`INT-001 outside checkout: app=${dir} caller=${caller} skill=${installedSkill}`)
    const install = await run(dir, ['ci'], 'INT-001-install', caller)
    expect(install.code, install.output).toBe(0)
    const pkg = JSON.parse(await read(join(dir, 'package.json')))
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[dep]).toBeTruthy()
    for (const dep of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'globals', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']) expect(pkg.devDependencies[dep]).toBeTruthy()
    expect(JSON.stringify(pkg)).not.toMatch(/tailwind/i)
    for (const subdir of ['src/presentation-kit', 'scripts']) {
      const canonical = await files(resolve(root, subdir))
      expect(await files(join(dir, subdir))).toEqual(canonical)
      for (const file of canonical) expect(await read(join(dir, subdir, file))).toBe(await read(resolve(root, subdir, file)))
    }
    const kit = (await Promise.all((await files(join(dir, 'src/presentation-kit'))).map(file => read(join(dir, 'src/presentation-kit', file))))).join('\n')
    expect(kit).not.toMatch(/#[\da-f]{3,8}\b|fontFamily:|boxShadow:|borderRadius:|backgroundColor:/i)
    expect(await read(join(dir, 'src/index.css'))).not.toMatch(/color:|font:|border:|padding:|--[\w-]+:/)
    expect(await read(join(dir, 'src/presentations/index.ts'))).toContain("slug: 'starter'")
    const verification = await run(dir, ['run', 'verify'], 'INT-001-verify', caller)
    expect(verification.code, verification.output).toBe(0); expect(verification.output).toContain('PASS render step 0/1'); expect(verification.output).toContain('PASS verification'); assertCleanResources(verification.output)
    // Exercise npm run verify after deleting the starter, with two user-owned routes.
    const talk = await read(join(dir, 'src/presentations/starter/Talk.tsx'))
    for (const slug of ['my-story', 'another-story']) {
      await mkdir(join(dir, 'src/presentations', slug))
      await writeFile(join(dir, 'src/presentations', slug, 'Talk.tsx'), talk.replaceAll('starter:', `${slug}:`))
    }
    await rm(join(dir, 'src/presentations/starter'), { recursive: true })
    await change(dir, 'src/presentations/index.ts', source => source.replace(/export const presentations:[\s\S]+/, `export const presentations: readonly Registration[] = [{ slug: 'my-story', title: 'My story', load: () => import('./my-story/Talk') }, { slug: 'another-story', title: 'Another story', load: () => import('./another-story/Talk') }]`))
    const userVerification = await run(dir, ['run', 'verify'], 'INT-001-user-routes', caller)
    expect(userVerification.code, userVerification.output).toBe(0)
    for (const slug of ['my-story', 'another-story']) { expect(userVerification.output).toContain(`PASS route ${slug}`); expect(userVerification.output).toContain(`PASS render step 1/1 route=${slug}`) }
    expect(userVerification.output).not.toContain('PASS route starter'); assertCleanResources(userVerification.output)
    await change(dir, 'src/presentations/another-story/Talk.tsx', source => source.replace('return <SceneLayer>', 'console.error("user route fault"); return <SceneLayer>'))
    const userFailure = await run(dir, ['run', 'verify'], 'INT-001-user-route-failure', caller)
    expect(userFailure.code, userFailure.output).not.toBe(0); expect(userFailure.output).toContain('PASS route my-story')
    expect(userFailure.output).toContain('route another-story: step 0: console user route fault')
    expect(userFailure.output).not.toContain('PASS verification:'); assertCleanResources(userFailure.output)
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
    expect(output.output).toContain('ADVISORY step 0'); expect(output.output).toContain('ADVISORY step 1'); expect(output.output).toContain('not a visual pass/fail'); assertCleanResources(output.output)
    // Keep fixture artifacts inside the test's own ignored results, never in source.
    await cp(artifactDir, join(work, 'INT-002-artifacts'), { recursive: true })
  })
  it('E2E-001 reference passes the public production verification gate', async () => {
    const dir = await fixture('reference')
    const result = await run(dir, ['run', 'verify'], 'E2E-001')
    expect(result.code, result.output).toBe(0)
    for (let i = 0; i < 9; i++) expect(result.output).toContain(`PASS render step ${i}/8`)
    expect(result.output).toContain('PASS verification: build, registration, render'); expect(result.output).toContain('http://127.0.0.1:'); expect(result.output).not.toContain('localhost'); assertCleanResources(result.output)
  })
  const cases = [
    ['build', async dir => change(dir, 'src/main.tsx', s => s + '\nconst broken: number = "type error"; console.log(broken)\n'), 'FAIL build:'],
    ['missing', async dir => { await change(dir, 'src/presentations/index.ts', s => s.replace(/export const presentations:[\s\S]+/, 'export const presentations: readonly Registration[] = []\n')); await rm(join(dir, 'src/presentations/how-to-make-a-presentation'), { recursive: true }) }, 'FAIL sample:'],
    ['order', async dir => change(dir, 'src/presentations/how-to-make-a-presentation/metadata.ts', s => s.replace(/export const metadata = ([\s\S]+) as const/, (_, json) => { const rows = JSON.parse(json); [rows[0], rows[1]] = [rows[1], rows[0]]; return 'export const metadata = ' + JSON.stringify(rows) + ' as const' })), 'FAIL sample:'],
    ['console', async dir => change(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', s => s.replace('return <SceneLayer>', 'if (payload === 2) console.error("injected console fault")\n  return <SceneLayer>')), 'step 2: console'],
    ['page', async dir => change(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', s => s.replace('return <SceneLayer>', 'if (payload === 2) setTimeout(() => { throw new Error("injected page fault") }, 50)\n  return <SceneLayer>')), 'step 2: page'],
    ['render', async dir => change(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', s => s.replace('return <SceneLayer>', 'if (payload === 2) throw new Error("injected render fault")\n  return <SceneLayer>')), 'injected render fault'],
    ['transition', async dir => change(dir, 'src/presentation-kit/usePresentationNav.ts', s => s.replace('clamp(i + 1, count)', 'clamp(i, count)')), 'step 1: transition did not advance'],
  ]
  for (const [name, inject, message] of cases) it(`E2E-002 ${name} failure is actionable and cleans subprocesses`, async () => {
    const before = await read(resolve(root, 'src/presentations/how-to-make-a-presentation/metadata.ts'))
    const dir = await fixture(`fault-${name}`); await inject(dir)
    const result = await run(dir, ['run', 'verify'], `E2E-002-${name}`)
    expect(result.code, result.output).not.toBe(0); expect(result.output).toContain(message); expect(result.output).not.toContain('PASS verification:'); if (['console','page','render','transition'].includes(name)) expect(result.output).toContain('FAIL render:'); assertCleanResources(result.output, ['build', 'missing', 'order'].includes(name) ? 0 : 1)
    if (name === 'render') { expect(result.output).toContain('step 2:'); expect(result.output).not.toContain('transition did not advance') }
    expect(await read(resolve(root, 'src/presentations/how-to-make-a-presentation/metadata.ts'))).toBe(before)
  })
})
