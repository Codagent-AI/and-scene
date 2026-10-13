import { afterEach, describe, expect, it } from 'vitest'
import { cp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const bootstrap = resolve(root, 'skills/presentation/templates/bootstrap')
const projects = []

async function materialize() {
  const directory = await import('node:fs/promises').then(({ mkdtemp }) => mkdtemp(join(tmpdir(), 'and-scene-integration-')))
  projects.push(directory)
  await cp(bootstrap, directory, { recursive: true })
  await symlink(resolve(root, 'node_modules'), join(directory, 'node_modules'), 'dir')
  return directory
}

async function register(directory, slug, title) {
  const registryPath = join(directory, 'src/presentations/index.ts')
  await writeFile(registryPath, `import type { ReactElement } from 'react'\nexport interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: () => ReactElement }> }\nexport const presentations: PresentationEntry[] = [{ slug: '${slug}', title: '${title}', load: () => import('./${slug}/Talk') }]\n`)
}

async function createTwoStepPresentation(directory, { slug, errorOnFirstStep = false }) {
  const presentation = join(directory, 'src/presentations', slug)
  await mkdir(join(presentation, 'steps'), { recursive: true })
  await writeFile(join(presentation, 'Talk.tsx'), `import { Presentation } from '../../presentation-kit/Presentation'\nimport { STEPS } from './steps'\nimport './style.css'\nexport default function Talk() { return <Presentation steps={STEPS} title="${slug}" initialMode="browse" /> }\n`)
  await writeFile(join(presentation, 'steps/Scene.tsx'), `import type { SceneProps } from '../../../presentation-kit/types'\ninterface Payload { beat: number }\nexport function Scene({payload}: SceneProps<Payload>) { void payload; ${errorOnFirstStep ? "if(payload.beat===0) console.error('controlled browser failure');" : ''} return <div className="fixture-scene"><div data-presentation-entity="accidental-a" style={{left:100,top:80}}>accidental overlap alpha</div><div data-presentation-entity="accidental-b" style={{left:110,top:80}}>accidental overlap beta</div><div data-presentation-allow-overlap><div data-presentation-entity="intentional-a" style={{left:400,top:120}}>intentional overlap alpha</div><div data-presentation-entity="intentional-b" style={{left:410,top:120}}>intentional overlap beta</div></div></div> }\n`)
  await writeFile(join(presentation, 'steps/index.ts'), `import type { Step } from '../../../presentation-kit/types'\nimport { Scene } from './Scene'\nexport const STEPS: Step<{beat:number}>[] = [0,1].map((beat) => ({id: 'step-'+beat, era: beat ? 'later' : 'start', title: 'Step '+beat, caption: 'Caption '+beat, groupKey: 'scene', Scene, payload: {beat}}))\n`)
  await writeFile(join(presentation, 'style.css'), `.fixture-scene{position:relative;width:880px;height:380px}.fixture-scene [data-presentation-entity]{position:absolute}\n`)
  await register(directory, slug, slug)
}

function command(directory, args, timeout = 120_000) {
  const result = spawnSync('npm', args, { cwd: directory, encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024 })
  return { status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}`, error: result.error }
}

afterEach(async () => {
  await Promise.all(projects.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('materialized presentation project integration', () => {
  it('builds and browser-verifies a registered sample outside the source project', async () => {
    const directory = await materialize()
    const sample = resolve(root, 'src/presentations/how-to-make-a-presentation')
    await cp(sample, join(directory, 'src/presentations/how-to-make-a-presentation'), { recursive: true })
    await register(directory, 'how-to-make-a-presentation', 'How to Use This Skill to Make a Presentation')
    const { status, output, error } = command(directory, ['run', 'verify'])
    expect(error).toBeUndefined()
    expect(status).toBe(0)
    expect(output).toContain('PASS: build and production browser render for how-to-make-a-presentation (9 steps)')
    const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) expect(manifest.dependencies[dependency]).toBeTruthy()
    for (const dependency of ['vite', '@vitejs/plugin-react', 'typescript', 'eslint', 'playwright']) expect(manifest.devDependencies[dependency]).toBeTruthy()
  }, 120_000)

  it('captures settled screenshots and reports visual diagnostics with overlap exemptions', async () => {
    const directory = await materialize()
    await createTwoStepPresentation(directory, { slug: 'warning-check' })
    const build = command(directory, ['run', 'build'])
    expect(build.error).toBeUndefined()
    expect(build.status, build.output).toBe(0)
    const inspection = command(directory, ['run', 'inspect', '--', 'warning-check'])
    expect(inspection.error).toBeUndefined()
    expect(inspection.status).toBe(0)
    expect(inspection.output).toContain('possible overlap: accidental-a / accidental-b')
    expect(inspection.output).toContain('active progress state is indistinct')
    expect(inspection.output).toContain('active table-of-contents state is indistinct')
    expect(inspection.output).toContain('attribution may need styling via [data-presentation-attribution]')
    expect(inspection.output).not.toContain('intentional-a / intentional-b')
    const screenshots = await readdir(join(directory, 'artifacts/inspection/warning-check'))
    expect(screenshots.filter((name) => name.endsWith('.png'))).toHaveLength(2)
  }, 120_000)

  it('fails verification on browser errors and cleans up the preview process', async () => {
    const directory = await materialize()
    await createTwoStepPresentation(directory, { slug: 'browser-failure', errorOnFirstStep: true })
    const result = command(directory, ['run', 'verify'])
    expect(result.error).toBeUndefined()
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('console error at step 1: controlled browser failure')
    await expect(fetch('http://127.0.0.1:4173')).rejects.toThrow()
  }, 120_000)
})
