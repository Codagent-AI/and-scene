import { cp, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { expect, it } from 'vitest'

const root = process.cwd()
const sample = 'src/presentations/how-to-make-a-presentation'

async function freePort() {
  const server = createServer()
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No test port')
  const port = address.port
  await new Promise<void>(resolve => server.close(() => resolve()))
  return port
}

async function runFixture(edit?: (dir: string) => Promise<void>) {
  // Fixtures stay inside this repository; the source checkout is never mutated.
  await mkdir(resolve('.artifacts/e2e'), { recursive: true })
  const dir = resolve(`.artifacts/e2e/verify-${crypto.randomUUID()}`)
  await mkdir(dir)
  for (const name of await readdir(root)) {
    if (['node_modules', 'dist', '.git', '.artifacts'].includes(name)) continue
    await cp(join(root, name), join(dir, name), { recursive: true })
  }
  await symlink(resolve('node_modules'), join(dir, 'node_modules'), 'dir')
  const port = await freePort()
  try {
    await edit?.(dir)
    const result = await new Promise<{ code: number; output: string }>(resolve => {
      const child = spawn('npm', ['run', 'verify'], {
        cwd: dir, env: { ...process.env, NODE_ENV: 'production', VERIFY_PORT: String(port) },
        detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
      })
      let output = ''
      child.stdout.on('data', data => { output += data })
      child.stderr.on('data', data => { output += data })
      child.on('error', error => { output += error.message })
      // A test timeout must also stop npm's descendants, not orphan a verifier.
      const timer = setTimeout(() => {
        output += '\nE2E subprocess timed out\n'
        try {
          if (process.platform === 'win32') child.kill('SIGTERM')
          else process.kill(-child.pid!, 'SIGTERM')
        } catch { /* process already exited */ }
      }, 240000)
      child.on('close', code => { clearTimeout(timer); resolve({ code: code ?? 1, output }) })
    })
    // Prove cleanup on both success and every browser failure, using the actual preview port.
    const probe = createServer()
    await new Promise<void>((resolve, reject) => {
      probe.once('error', reject)
      probe.listen(port, '127.0.0.1', resolve)
    })
    await new Promise<void>(resolve => probe.close(() => resolve()))
    return result
  } finally { await rm(dir, { recursive: true, force: true }) }
}

async function replace(dir: string, path: string, from: string, to: string) {
  const file = join(dir, path)
  const source = await readFile(file, 'utf8')
  if (!source.includes(from)) throw new Error(`Fixture marker absent: ${from}`)
  await writeFile(file, source.replace(from, to))
}

it('E2E-001 builds an isolated app and observes all nine normative steps over IPv4', async () => {
  const result = await runFixture()
  expect(result.output).toContain('http://127.0.0.1:')
  for (let i = 0; i < 9; i++) expect(result.output).toContain(`how-to-make-a-presentation step ${i} OK`)
  expect(result.output).toContain('PASS')
  expect(result.code).toBe(0)
})

const faults: [string, string, number | undefined, (dir: string) => Promise<void>][] = [
  ['type error anywhere in app', 'build', undefined, dir => writeFile(join(dir, 'src/broken.ts'), 'export const broken: number = "wrong"\n')],
  ['missing registry entry', 'sample', undefined, dir => replace(dir, 'src/presentations/index.ts', "slug: 'how-to-make-a-presentation'", "slug: 'removed-reference' /* how-to-make-a-presentation */")],
  ['missing landing link', 'sample', undefined, dir => replace(dir, 'src/Landing.tsx', 'data-presentation-link', 'data-hidden-link')],
  ['out-of-order title', 'sample', 0, dir => replace(dir, `${sample}/steps/index.tsx`, 'You have a topic', 'The skill interviews you')],
  ['wrong step count', 'sample', 0, dir => replace(dir, `${sample}/Talk.tsx`, 'steps={STEPS}', 'steps={STEPS.slice(0, 8)}')],
  ['console failure on a later step', 'render', 6, dir => replace(dir, `${sample}/steps/Scene.tsx`, 'return <SceneLayer', "if (payload.beat === 7) console.error('injected console failure')\n  return <SceneLayer")],
  ['uncaught browser failure', 'render', 6, dir => replace(dir, `${sample}/steps/Scene.tsx`, 'return <SceneLayer', "if (payload.beat === 7) setTimeout(() => { throw new Error('injected page failure') }, 10)\n  return <SceneLayer")],
  ['stalled navigation', 'transition', 1, dir => replace(dir, 'src/presentation-kit/usePresentationNav.ts', 'Math.min(last, value + 1)', 'Math.min(last, value)')],
]

it.each(faults)('E2E-002 rejects %s and cleans up preview', async (_name, phase, step, edit) => {
  const result = await runFixture(edit)
  expect(result.code).not.toBe(0)
  expect(result.output).toContain(`FAIL phase=${phase}`)
  if (step !== undefined) expect(result.output).toContain(`step=${step}`)
  expect(result.output).not.toContain('PASS')
})

it('renders additional registered routes even with no configured references', async () => {
  const result = await runFixture(async dir => {
    await writeFile(join(dir, 'verify.config.json'), '{"referencePresentations": []}')
    await replace(dir, 'src/presentations/index.ts', 'how-to-make-a-presentation\'', 'other-route\'')
  })
  expect(result.output).toContain('other-route step 8 OK')
  expect(result.output).toContain('PASS')
  expect(result.code).toBe(0)
})

it('requires landing links for registered routes even with no configured references', async () => {
  const result = await runFixture(async dir => {
    await writeFile(join(dir, 'verify.config.json'), '{"referencePresentations": []}')
    await replace(dir, 'src/Landing.tsx', 'data-presentation-link', 'data-hidden-link')
  })
  expect(result.code).not.toBe(0)
  expect(result.output).toContain('FAIL phase=sample')
  expect(result.output).toContain('Registered presentation how-to-make-a-presentation is absent from landing links')
  expect(result.output).not.toContain('PASS')
})

it('requires landing links for every registered route, including non-reference presentations', async () => {
  const result = await runFixture(async dir => {
    await replace(dir, 'src/presentations/index.ts', '\n]\n', "\n  { slug: 'unlinked-presentation', title: 'Unlinked presentation', load: () => import('./how-to-make-a-presentation/Talk') },\n]\n")
    await replace(dir, 'src/Landing.tsx', 'entries.map(entry =>', "entries.filter(entry => entry.slug !== 'unlinked-presentation').map(entry =>")
  })
  expect(result.code).not.toBe(0)
  expect(result.output).toContain('FAIL phase=sample')
  expect(result.output).toContain('Registered presentation unlinked-presentation is absent from landing links')
  expect(result.output).not.toContain('PASS')
})

it('rejects an empty application instead of claiming to verify zero presentations', async () => {
  const result = await runFixture(async dir => {
    await writeFile(join(dir, 'verify.config.json'), '{"referencePresentations": []}')
    const file = join(dir, 'src/presentations/index.ts')
    const source = await readFile(file, 'utf8')
    await writeFile(file, source.replace(/export const presentations: PresentationEntry\[\] = \[[\s\S]*$/, 'export const presentations: PresentationEntry[] = []\n'))
  })
  expect(result.code).not.toBe(0)
  expect(result.output).toContain('FAIL phase=render')
  expect(result.output).toContain('Landing page exposes no presentation links')
  expect(result.output).not.toContain('PASS')
})
