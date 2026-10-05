import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const nodeModules = path.join(repository, 'node_modules')
const tempRoots: string[] = []

function isolatedCopy(prefix: string) {
  const directory = mkdtempSync(path.join(os.tmpdir(), prefix))
  tempRoots.push(directory)
  cpSync(repository, directory, { recursive: true, filter: (source) => {
    const relative = path.relative(repository, source)
    return !relative.split(path.sep).some((part) => ['node_modules', '.git', 'dist', 'inspection', 'coverage', 'validator_logs'].includes(part))
  } })
  symlinkSync(nodeModules, path.join(directory, 'node_modules'), 'dir')
  return directory
}

function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout: 180_000, maxBuffer: 8 * 1024 * 1024 })
  return { status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

function replaceFile(root: string, relative: string, replace: (source: string) => string) {
  const file = path.join(root, relative)
  const source = readFileSync(file, 'utf8')
  const updated = replace(source)
  if (updated === source) throw new Error(`fault injection did not change ${relative}`)
  writeFileSync(file, updated)
}

describe('presentation verification (INT-002, E2E-001, E2E-002)', () => {
  it('captures settled screenshots and reports overlap, exemption, active-state, and attribution diagnostics (INT-002)', () => {
    const target = isolatedCopy('and-scene-inspection-fixture-')
    replaceFile(target, 'src/presentations/index.ts', (source) => source.replace(/\]\s*$/, "  { slug: 'inspection-fixture', title: 'Inspection Fixture', load: () => import('./inspection-fixture/Talk') },\n]"))
    const fixture = path.join(target, 'src/presentations/inspection-fixture')
    mkdirSync(fixture, { recursive: true })
    writeFileSync(path.join(fixture, 'Talk.tsx'), `import { Presentation, SceneLayer } from '../../presentation-kit'\nimport type { Step } from '../../presentation-kit'\nimport './style.css'\nfunction Scene({ index }: { index: number }) { return <SceneLayer><div className="fixture-collision"><span data-presentation-node="collision-first">first</span><span data-presentation-node="collision-second">second</span></div><div className="fixture-exemption" data-presentation-allow-overlap><span data-presentation-node="exempt-first">intentional</span><span data-presentation-node="exempt-second">overlap</span></div><div className="settle-marker" data-presentation-node="settling">step {index + 1}</div></SceneLayer> }\nconst steps: readonly Step[] = [1, 2].map((number) => ({ id: 'inspection-fixture/' + number, era: 'fixture', title: 'Step ' + number, caption: 'Controlled inspection fixture', Scene, payload: undefined }))\nexport default function Talk() { return <Presentation title="Inspection Fixture" steps={steps} className="inspection-fixture" attribution={<a data-presentation-attribution href="#fixture">fixture attribution</a>} /> }\n`)
    writeFileSync(path.join(fixture, 'style.css'), `.fixture-collision, .fixture-exemption { position:absolute; left:20px; top:20px; } .fixture-collision span, .fixture-exemption span { position:absolute; left:0; top:0; } .fixture-collision span:nth-child(2), .fixture-exemption span:nth-child(2) { left:1px; } .settle-marker { position:absolute; top:70px; left:20px; animation: settle-color 150ms linear forwards; } @keyframes settle-color { from { color:transparent } to { color:#123456 } } .inspection-fixture .presentation-progress button { color:inherit; background:transparent; border-color:transparent; font-weight:400; opacity:1; }`)
    const built = run('npm', ['run', 'build'], target)
    expect(built.status, built.output).toBe(0)
    const started = Date.now()
    const inspected = run(process.execPath, ['scripts/inspect-presentation.mjs', 'inspection-fixture'], target, { ...process.env, PRESENTATION_SETTLE_MS: '350' })
    const elapsed = Date.now() - started
    expect(inspected.status, inspected.output).toBe(0)
    expect(inspected.output).toContain('Captured 2 settled screenshots')
    expect(inspected.output).toContain('settle 350 ms')
    expect(elapsed).toBeGreaterThanOrEqual(650)
    expect(inspected.output).toContain('step 1: possible text/chrome overlap: collision-first overlaps collision-second')
    expect(inspected.output).not.toContain('exempt-first overlaps exempt-second')
    expect(inspected.output).toContain('active progress or table-of-contents state may be visually indistinct')
    expect(inspected.output).toContain('browser-default looking attribution')
    expect(readdirSync(path.join(target, 'inspection/inspection-fixture')).filter((file) => file.endsWith('.png'))).toHaveLength(2)
  }, 180_000)

  it('builds and renders the canonical registered presentation through npm run verify (E2E-001)', () => {
    const result = run('npm', ['run', 'verify'], repository)
    expect(result.status, result.output).toBe(0)
    expect(result.output).toContain('PASS: built app and rendered 9 steps across 1 registered presentations')
  }, 180_000)

  it.each([
    ['build failure', 'src/presentations/how-to-make-a-presentation/steps/step-01.tsx', (source: string) => `${source}\nconst broken: string = 42\n`, /FAIL: npm run build exited with/],
    ['runtime console error', 'src/presentations/how-to-make-a-presentation/Scene.tsx', (source: string) => source.replace('export function Scene({ index }: { index: number }) {', 'export function Scene({ index }: { index: number }) { if (index === 0) console.error("fault injection")'), /FAIL: how-to-make-a-presentation step 1: console error: fault injection/],
    ['uncaught page error', 'src/presentations/how-to-make-a-presentation/Scene.tsx', (source: string) => source.replace('export function Scene({ index }: { index: number }) {', 'export function Scene({ index }: { index: number }) { if (index === 0) queueMicrotask(() => { throw new Error("fault injection pageerror") })'), /FAIL: how-to-make-a-presentation step 1: uncaught page error: fault injection pageerror/],
    ['failed transition', 'src/presentation-kit/usePresentationNav.ts', (source: string) => source.replace('const next = useCallback(() => goTo(index + 1), [goTo, index])', 'const next = useCallback(() => goTo(index), [goTo, index])'), /FAIL: how-to-make-a-presentation step 2: transition did not advance/],
    ['malformed reference outline', 'src/presentations/how-to-make-a-presentation/steps/step-04.tsx', (source: string) => source.replace('The deck grows', 'The deck has grown'), /FAIL: sample check failed at step 4/],
    ['unregistered reference sample', 'src/presentations/index.ts', (source: string) => source.replace("slug: 'how-to-make-a-presentation'", "slug: 'renamed-sample'"), /FAIL: sample check failed: registered reference presentation/],
  ] as const)('fails clearly for an isolated %s fault (E2E-002)', (_label, relative, mutate, expected) => {
    const target = isolatedCopy('and-scene-verification-fault-')
    replaceFile(target, relative, mutate)
    const result = run('npm', ['run', 'verify'], target)
    expect(result.status).not.toBe(0)
    expect(result.output).toMatch(expected)
    expect(existsSync(path.join(target, 'dist'))).toBe(relative !== 'src/presentations/how-to-make-a-presentation/steps/step-01.tsx')
  }, 180_000)
})

afterAll(() => { for (const directory of tempRoots) rmSync(directory, { recursive: true, force: true }) })
