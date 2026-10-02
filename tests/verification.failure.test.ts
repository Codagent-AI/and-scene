import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const projects: string[] = []
afterEach(() => { for (const project of projects.splice(0)) rmSync(project, { recursive: true, force: true }) })

function isolatedCopy() {
  const project = mkdtempSync(join(tmpdir(), 'and-scene-verify-'))
  projects.push(project)
  for (const item of ['src', 'public']) cpSync(join(root, item), join(project, item), { recursive: true })
  for (const item of ['package.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) cpSync(join(root, item), join(project, item))
  mkdirSync(join(project, 'scripts'), { recursive: true })
  cpSync(join(root, 'scripts/verify.mjs'), join(project, 'scripts/verify.mjs'))
  symlinkSync(join(root, 'node_modules'), join(project, 'node_modules'), 'dir')
  return project
}

function verify(project: string) {
  return spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: project, encoding: 'utf8', timeout: 90_000 })
}

describe('reference verification failure contract', () => {
  it('fails clearly for independent build, sample, runtime, and transition faults in disposable copies', () => {
    const build = isolatedCopy()
    writeFileSync(join(build, 'src/Landing.tsx'), 'export default function Landing( {')
    const buildResult = verify(build)
    expect(buildResult.status).not.toBe(0)
    expect(`${buildResult.stdout}\n${buildResult.stderr}`).toContain('Build verification failed')

    const sample = isolatedCopy()
    const registryPath = join(sample, 'src/presentations/index.ts')
    writeFileSync(registryPath, readFileSync(registryPath, 'utf8').replace("'how-to-make-a-presentation'", "'missing-reference'"))
    const sampleResult = verify(sample)
    expect(sampleResult.status).not.toBe(0)
    expect(`${sampleResult.stdout}\n${sampleResult.stderr}`).toContain('Sample registration check failed')

    const runtime = isolatedCopy()
    writeFileSync(join(runtime, 'src/presentations/how-to-make-a-presentation/Talk.tsx'), "export default function Talk() { return <div>{(() => { throw new Error('fixture runtime fault') })()}</div> }\n")
    const runtimeResult = verify(runtime)
    expect(runtimeResult.status).not.toBe(0)
    expect(`${runtimeResult.stdout}\n${runtimeResult.stderr}`).toContain('step 1')

    const transition = isolatedCopy()
    const navPath = join(transition, 'src/presentation-kit/usePresentationNav.ts')
    const nav = readFileSync(navPath, 'utf8')
    writeFileSync(navPath, nav.replace('const next = useCallback(() => goTo(safeIndex + 1)', 'const next = useCallback(() => goTo(safeIndex)'))
    const transitionResult = verify(transition)
    expect(transitionResult.status).not.toBe(0)
    expect(`${transitionResult.stdout}\n${transitionResult.stderr}`).toContain('step 2')
    for (const result of [buildResult, sampleResult, runtimeResult, transitionResult]) expect(result.error).toBeUndefined()
  }, 300_000)
})
