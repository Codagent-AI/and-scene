import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..')
const files = ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', 'src', 'scripts']

async function runFaultyVerification(fault: 'build' | 'sample' | 'browser' | 'transition') {
  const directory = await mkdtemp(path.join(tmpdir(), 'and-scene-e2e-'))
  try {
    for (const file of files) await cp(path.join(root, file), path.join(directory, file), { recursive: true })
    await symlink(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'dir')
    const pathFor = (file: string) => path.join(directory, file)
    if (fault === 'build') {
      const file = pathFor('src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      await writeFile(file, `${await readFile(file, 'utf8')}\nthis is invalid TypeScript !!!\n`)
    }
    if (fault === 'sample') {
      const file = pathFor('src/presentations/how-to-make-a-presentation/steps/index.tsx')
      const source = await readFile(file, 'utf8')
      await writeFile(file, source.replace('You have a topic', 'A different first beat'))
    }
    if (fault === 'browser') {
      const file = pathFor('src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      await writeFile(file, `console.error('injected browser error')\n${await readFile(file, 'utf8')}`)
    }
    if (fault === 'transition') {
      const file = pathFor('src/presentation-kit/Presentation.tsx')
      const source = await readFile(file, 'utf8')
      await writeFile(file, source.replace('data-step-index={nav.index}', 'data-step-index={0}'))
    }
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

  it('reports a stalled transition with its expected step', async () => {
    const result = await runFaultyVerification('transition')
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('FAIL: browser render: step 2 did not render or advance')
  }, 90_000)
})
