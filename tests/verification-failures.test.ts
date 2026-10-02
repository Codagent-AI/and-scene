import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const repo = process.cwd()
const scratch: string[] = []

async function copyApp() {
  const target = await mkdtemp(path.join(os.tmpdir(), 'and-scene-verify-fault-'))
  scratch.push(target)
  for (const name of ['dist', 'scripts', 'src']) await cp(path.join(repo, name), path.join(target, name), { recursive: true })
  for (const name of ['package.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) await cp(path.join(repo, name), path.join(target, name))
  await symlink(path.join(repo, 'node_modules'), path.join(target, 'node_modules'), 'dir')
  return target
}

function failure(target: string, command = 'node', args = ['scripts/verify.mjs']) {
  try {
    execFileSync(command, args, { cwd: target, encoding: 'utf8', stdio: 'pipe', timeout: 90_000 })
    throw new Error('verification unexpectedly succeeded')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).message === 'verification unexpectedly succeeded') throw error
    const result = error as { status?: number; stdout?: string; stderr?: string }
    return { status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
  }
}

afterAll(async () => { await Promise.all(scratch.map((directory) => rm(directory, { recursive: true, force: true }))) })

describe('verification reports actionable failures in isolated copies', () => {
  it('fails a build error without changing the source checkout', async () => {
    const target = await copyApp()
    const scene = path.join(target, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
    await writeFile(scene, `${await readFile(scene, 'utf8')}\nconst invalid: number = 'build fault'\n`)
    const result = failure(target, 'npm', ['run', 'verify'])
    expect(result.status).not.toBe(0)
    expect(result.output).toMatch(/error|failed|cannot|invalid/i)
    expect(await readFile(path.join(repo, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'), 'utf8')).not.toContain('build fault')
  }, 90_000)

  it('fails a missing or malformed reference outline before browser launch', async () => {
    const missing = await copyApp()
    const registry = path.join(missing, 'src/presentations/index.ts')
    await writeFile(registry, 'export const presentations = []\n')
    expect(failure(missing).output).toMatch(/reference sample is missing/i)

    const malformed = await copyApp()
    const steps = path.join(malformed, 'src/presentations/how-to-make-a-presentation/steps/index.ts')
    await writeFile(steps, (await readFile(steps, 'utf8')).replace('You have a topic', 'Not the required title'))
    expect(failure(malformed).output).toMatch(/reference era, title, caption, or order/i)
  }, 30_000)

  it('identifies browser console and non-advancing transition faults by step', async () => {
    const runtime = await copyApp()
    const runtimeHtml = path.join(runtime, 'dist/index.html')
    await writeFile(runtimeHtml, (await readFile(runtimeHtml, 'utf8')).replace('<body>', '<body><script>setTimeout(() => console.error("injected runtime fault"), 300)</script>'))
    const runtimeFailure = failure(runtime)
    expect(runtimeFailure.status).not.toBe(0)
    expect(runtimeFailure.output).toMatch(/step 1.*injected runtime fault/i)

    const transition = await copyApp()
    const transitionHtml = path.join(transition, 'dist/index.html')
    await writeFile(transitionHtml, (await readFile(transitionHtml, 'utf8')).replace('<body>', '<body><script>document.addEventListener("keydown", event => { if (event.key === "ArrowRight") event.stopImmediatePropagation() }, true)</script>'))
    const transitionFailure = failure(transition)
    expect(transitionFailure.status).not.toBe(0)
    expect(transitionFailure.output).toMatch(/step 1/i)
    expect(transitionFailure.output).toMatch(/timeout|waiting|transition/i)
  }, 90_000)
})
