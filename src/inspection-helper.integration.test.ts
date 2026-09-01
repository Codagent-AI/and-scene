import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const repositoryRoot = process.cwd()
const temporaryProjects: string[] = []

function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd, env, maxBuffer: 2_000_000 }, (error, stdout, stderr) => {
      const output = `${stdout}${stderr}`
      if (error) reject(new Error(`${error.message}\n${output}`))
      else resolve(output)
    })
  })
}

function availablePort(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Could not reserve an inspection port.'))
        return
      }
      server.close((error) => error ? reject(error) : resolve(String(address.port)))
    })
  })
}

afterEach(async () => {
  await Promise.all(temporaryProjects.splice(0).map((project) => rm(project, { force: true, recursive: true })))
})

describe('INT-002 presentation inspection helper', () => {
  it('captures settled controlled steps and reports only unmarked visual defects', async () => {
    const project = await mkdtemp(join(tmpdir(), 'and-scene-inspection-'))
    temporaryProjects.push(project)
    for (const entry of [
      'eslint.config.js',
      'index.html',
      'package.json',
      'scripts',
      'src',
      'tsconfig.app.json',
      'tsconfig.json',
      'tsconfig.node.json',
      'vite.config.ts',
    ]) {
      await cp(join(repositoryRoot, entry), join(project, entry), { recursive: true })
    }
    await symlink(join(repositoryRoot, 'node_modules'), join(project, 'node_modules'), 'dir')

    const fixtureDirectory = join(project, 'src/presentations/inspection-fixture')
    await mkdir(fixtureDirectory, { recursive: true })
    await writeFile(join(fixtureDirectory, 'Talk.tsx'), `import { Presentation, type SceneProps, type Step } from '../../presentation-kit'

type Payload = { allowOverlap: boolean }

function FixtureScene({ payload }: SceneProps<Payload>) {
  return (
    <div
      {...(payload.allowOverlap ? { 'data-presentation-allow-overlap': 'true' } : {})}
      style={{ height: 200, position: 'relative', width: 400 }}
    >
      <span data-presentation-step-title="fixture-a" style={{ left: 20, position: 'absolute', top: 20 }}>first collision label</span>
      <span data-presentation-step-title="fixture-b" style={{ left: 20, position: 'absolute', top: 20 }}>second collision label</span>
    </div>
  )
}

const steps: readonly Step<Payload>[] = [
  { id: 'unmarked', era: 'one', title: 'Unmarked collision', caption: 'This step must warn.', Scene: FixtureScene, payload: { allowOverlap: false } },
  { id: 'allowed', era: 'two', title: 'Allowed collision', caption: 'This step must not warn about its marked scene.', Scene: FixtureScene, payload: { allowOverlap: true } },
]

export default function Talk() {
  return <Presentation title="Inspection fixture" steps={steps} />
}
`)

    const registryPath = join(project, 'src/presentations/index.ts')
    const registry = await readFile(registryPath, 'utf8')
    await writeFile(registryPath, registry.replace(/\n\]\s*$/, `
  {
    slug: 'inspection-fixture',
    title: 'Inspection fixture',
    load: () => import('./inspection-fixture/Talk'),
  },
]`))

    const port = await availablePort()
    const output = await run('npm', ['run', 'inspect', '--', 'inspection-fixture'], project, {
      ...process.env,
      PRESENTATION_INSPECT_PORT: port,
      PRESENTATION_SETTLE_MS: '600',
    })

    expect(output).toContain('WARN step 1: unmarked text/chrome overlap: data-presentation-step-title ↔ data-presentation-step-title')
    expect(output).not.toContain('WARN step 2: unmarked text/chrome overlap: data-presentation-step-title ↔ data-presentation-step-title')
    expect(output).toContain('active progress state is visually indistinct')
    expect(output).toContain('active table-of-contents state is visually indistinct')
    expect(output).toContain('browser-default or undersized attribution')
    expect(output).toContain('Captured 2 settled screenshots in inspection-artifacts/inspection-fixture/.')

    const artifactDirectory = join(project, 'inspection-artifacts/inspection-fixture')
    expect(await readdir(artifactDirectory)).toEqual(['01.png', '02.png'])
    const [first, second] = await Promise.all([
      stat(join(artifactDirectory, '01.png')),
      stat(join(artifactDirectory, '02.png')),
    ])
    expect(first.size).toBeGreaterThan(0)
    expect(second.size).toBeGreaterThan(0)
    expect(second.mtimeMs - first.mtimeMs).toBeGreaterThanOrEqual(500)
  }, 60_000)
})
