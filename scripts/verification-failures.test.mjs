import { afterAll, describe, expect, it } from 'vitest'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const copies = []
const sourceFiles = ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'src', 'scripts/verify.mjs']

async function createCopy(name, edit) {
  const dir = await mkdtemp(join(tmpdir(), `and-scene-${name}-`))
  copies.push(dir)
  for (const path of sourceFiles) await cp(join(root, path), join(dir, path), { recursive: true })
  await symlink(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
  if (edit) await edit(dir)
  return dir
}

function verify(dir) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'verify'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('exit', (code) => resolve({ code, output }))
  })
}

async function replace(dir, path, before, after) {
  const file = join(dir, path)
  const content = await readFile(file, 'utf8')
  if (!content.includes(before)) throw new Error(`fault fixture did not find text in ${path}`)
  await writeFile(file, content.replace(before, after))
}

afterAll(async () => { await Promise.all(copies.map((dir) => rm(dir, { recursive: true, force: true }))) })

describe('E2E-002 isolated verification failure contract', () => {
  it('reports build failures with a non-zero outcome', async () => {
    const dir = await createCopy('build-fault', async (cwd) => replace(cwd, 'src/presentations/how-to-make-a-presentation/steps.tsx', "export const PRESENTATION_TITLE", 'const buildFault: = 1\nexport const PRESENTATION_TITLE'))
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/BUILD:|Build failed|error TS/i)
  }, 60000)

  it('rejects a missing canonical sample beat after the production build', async () => {
    const dir = await createCopy('outline-fault', async (cwd) => replace(cwd, 'src/presentations/how-to-make-a-presentation/steps.tsx', "title: 'You have a topic'", "title: 'Wrong topic'"))
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('SAMPLE CONTRACT: missing or out-of-order step: You have a topic')
  }, 60000)

  it('rejects rendered steps that diverge from the canonical outline', async () => {
    const dir = await createCopy('rendered-outline-fault', async (cwd) => replace(cwd, 'src/presentations/how-to-make-a-presentation/Talk.tsx', 'steps={STEPS}', 'steps={[...STEPS].reverse()}'))
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('SAMPLE CONTRACT: step 1 rendered "You\'re looking at one", expected "You have a topic"')
  }, 60000)

  it('identifies the sample step that throws in the browser', async () => {
    const dir = await createCopy('runtime-fault', async (cwd) => replace(cwd, 'src/presentations/how-to-make-a-presentation/Scene.tsx', 'function Scene({ payload }: SceneProps<Payload>) {', 'function Scene({ payload }: SceneProps<Payload>) { console.error("injected browser fault");'))
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('RENDER: step 1:')
    expect(result.output).toContain('injected browser fault')
  }, 60000)

  it('identifies a step whose public index does not advance', async () => {
    const dir = await createCopy('transition-fault', async (cwd) => replace(cwd, 'src/presentation-kit/Presentation.tsx', 'data-step-index={nav.index}', 'data-step-index={0}'))
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('TRANSITION: step 2 did not advance to index 1')
  }, 60000)
})
