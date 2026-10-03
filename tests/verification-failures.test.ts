import { execFileSync } from 'node:child_process'
import { createServer } from 'node:net'
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const canonical = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

type RunResult = { code: number | null; output: string }
type ExecFailure = { status?: number | null; stdout?: Buffer; stderr?: Buffer; message: string }

function failureResult(error: unknown): RunResult {
  const failure = error as ExecFailure
  const output = `${failure.stderr?.toString() ?? ''}${failure.stdout?.toString() ?? ''}${failure.status == null ? failure.message : ''}`
  return { code: failure.status ?? null, output }
}

async function runNode(temp: string, script: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  try {
    const output = execFileSync(process.execPath, [script], { cwd: temp, stdio: 'pipe', env: { ...process.env, ...env }, timeout: 90_000 })
    return { code: 0, output: output.toString() }
  } catch (error) { return failureResult(error) }
}

async function createScriptFixture(steps: string) {
  const temp = await mkdtemp(path.join(tmpdir(), 'and-scene-verify-fault-'))
  await mkdir(path.join(temp, 'scripts'), { recursive: true })
  await mkdir(path.join(temp, 'src/presentations/how-to-make-a-presentation'), { recursive: true })
  await symlink(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir')
  await writeFile(path.join(temp, 'scripts/verify.mjs'), await readFile(path.join(root, 'scripts/verify.mjs')))
  await writeFile(path.join(temp, 'src/presentations/index.ts'), "export const presentations = [{ slug: 'how-to-make-a-presentation', load: () => import('./how-to-make-a-presentation/Talk') }]\n")
  await writeFile(path.join(temp, 'src/presentations/how-to-make-a-presentation/steps.ts'), steps)
  await writeFile(path.join(temp, 'src/presentations/how-to-make-a-presentation/Talk.tsx'), 'export default function Talk() { return null }\n')
  return temp
}

async function availablePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  const port = (server.address() as { port: number }).port
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return port
}

async function createProjectCopy(): Promise<string> {
  const temp = await mkdtemp(path.join(tmpdir(), 'and-scene-e2e-fault-'))
  for (const file of ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html']) {
    await cp(path.join(root, file), path.join(temp, file))
  }
  await cp(path.join(root, 'src'), path.join(temp, 'src'), { recursive: true })
  await cp(path.join(root, 'public'), path.join(temp, 'public'), { recursive: true })
  await mkdir(path.join(temp, 'scripts'), { recursive: true })
  await cp(path.join(root, 'scripts/verify.mjs'), path.join(temp, 'scripts/verify.mjs'))
  await symlink(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir')
  return temp
}

async function runCopiedVerification(temp: string, port: number): Promise<RunResult> {
  try {
    const output = execFileSync('npm', ['run', 'verify'], {
      cwd: temp,
      stdio: 'pipe',
      env: { ...process.env, PREVIEW_PORT: String(port) },
      timeout: 90_000,
    })
    return { code: 0, output: output.toString() }
  } catch (error) { return failureResult(error) }
}

async function expectPreviewStopped(port: number) {
  const url = `http://127.0.0.1:${port}/`
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) throw new Error(`vite preview is still serving on ${port}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('still serving')) throw error
      return
    }
    await delay(100)
  }
  throw new Error(`vite preview did not stop on ${port}`)
}

describe('reference verification failure contract', () => {
  it('fails clearly when the committed sample is missing canonical content', async () => {
    const temp = await createScriptFixture("export const STEPS = []\n")
    try {
      const result = await runNode(temp, 'scripts/verify.mjs')
      expect(result.code).toBe(1)
      expect(result.output).toContain('reference sample check: step 1 is missing canonical content')
    } finally { await rm(temp, { recursive: true, force: true }) }
  }, 30_000)

  it('fails clearly when the canonical steps are out of order', async () => {
    const reversed = [...canonical].reverse().map(([era, title, caption]) => `${era} ${title} ${caption}`).join('\n')
    const temp = await createScriptFixture(reversed)
    try {
      const result = await runNode(temp, 'scripts/verify.mjs')
      expect(result.code).toBe(1)
      expect(result.output).toContain('reference sample check: step 1 is missing canonical content or is out of canonical order')
    } finally { await rm(temp, { recursive: true, force: true }) }
  }, 30_000)

  it('reports a build-breaking edit and never starts a preview', async () => {
    const temp = await createProjectCopy()
    const port = await availablePort()
    try {
      await writeFile(path.join(temp, 'src/build-fault.ts'), "export const invalid: number = 'type error'\n")
      const result = await runCopiedVerification(temp, port)
      expect(result.code).not.toBe(0)
      expect(result.output).toContain('FAIL: build phase')
      await expectPreviewStopped(port)
    } finally { await rm(temp, { recursive: true, force: true }) }
  }, 120_000)

  it('reports a browser console fault with its step and cleans up preview', async () => {
    const temp = await createProjectCopy()
    const port = await availablePort()
    try {
      const sceneFile = path.join(temp, 'src/presentations/how-to-make-a-presentation/Scene.tsx')
      const scene = await readFile(sceneFile, 'utf8')
      const marker = '  const step = payload.through'
      expect(scene).toContain(marker)
      await writeFile(sceneFile, scene.replace(marker, "  if (payload.through === 1) console.error('fault injected console error')\n" + marker))
      const result = await runCopiedVerification(temp, port)
      expect(result.code).not.toBe(0)
      expect(result.output).toContain('browser error:')
      expect(result.output).toContain('verification at step 1')
      expect(result.output).toContain('fault injected console error')
      await expectPreviewStopped(port)
    } finally { await rm(temp, { recursive: true, force: true }) }
  }, 120_000)

  it('reports a stalled transition with its step and cleans up preview', async () => {
    const temp = await createProjectCopy()
    const port = await availablePort()
    try {
      const navigationFile = path.join(temp, 'src/presentation-kit/usePresentationNav.ts')
      const navigation = await readFile(navigationFile, 'utf8')
      const workingUpdate = 'if (count > 0) setIndex(Math.max(0, Math.min(count - 1, next)))'
      expect(navigation).toContain(workingUpdate)
      await writeFile(navigationFile, navigation.replace(workingUpdate, 'if (count > 0) setIndex(current => Math.min(current, next))'))
      const result = await runCopiedVerification(temp, port)
      expect(result.code).not.toBe(0)
      expect(result.output).toContain('step 2: data-step-index did not advance')
      await expectPreviewStopped(port)
    } finally { await rm(temp, { recursive: true, force: true }) }
  }, 120_000)
})
