import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..')
const files = ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', 'src', 'scripts']

const scene = 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'
const outline = 'src/presentations/how-to-make-a-presentation/steps/index.tsx'
const kitRoot = 'src/presentation-kit/Presentation.tsx'
const faults = {
  build: [scene, (source: string) => `${source}\nthis is invalid TypeScript !!!\n`],
  sample: [outline, (source: string) => source.replace('You have a topic', 'A different first beat')],
  browser: [scene, (source: string) => `console.error('injected browser error')\n${source}`],
  'step-count': [kitRoot, (source: string) => source.replace('data-step-count={steps.length}', 'data-step-count="invalid"')],
  transition: [kitRoot, (source: string) => source.replace('data-step-index={nav.index}', 'data-step-index={0}')],
} as const

async function runFaultyVerification(fault: keyof typeof faults) {
  const directory = await mkdtemp(path.join(tmpdir(), 'and-scene-e2e-'))
  try {
    await Promise.all(files.map((file) => cp(path.join(root, file), path.join(directory, file), { recursive: true })))
    await symlink(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'dir')
    const [target, inject] = faults[fault]
    const file = path.join(directory, target)
    await writeFile(file, inject(await readFile(file, 'utf8')))
    const result = spawnSync('npm', ['run', 'verify'], { cwd: directory, encoding: 'utf8', timeout: 90_000 })
    return { status: result.status, output: `${result.stdout}\n${result.stderr}` }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

describe('verification failure contract in isolated project copies', () => {
  it('reports a build failure as non-zero', async () => {
    const result = await runFaultyVerification('build')
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('FAIL: build:')
  }, 90_000)

  it('reports a malformed reference outline as non-zero', async () => {
    const result = await runFaultyVerification('sample')
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('FAIL: sample contract:')
  }, 90_000)

  it('reports browser console errors with the failing step', async () => {
    const result = await runFaultyVerification('browser')
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('FAIL: browser render: step 1: injected browser error')
  }, 90_000)

  it('rejects a nonnumeric step count instead of reporting a pass', async () => {
    const result = await runFaultyVerification('step-count')
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('FAIL: browser render: presentation exposes an invalid step count')
  }, 90_000)

  it('reports a stalled transition with its expected step', async () => {
    const result = await runFaultyVerification('transition')
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('FAIL: browser render: step 2 did not render or advance')
  }, 90_000)
})
