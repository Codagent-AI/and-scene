import { cp, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { apply, createPresentation, detect, detectAnchors } from '../../skills/presentation/scripts/scaffold.mjs'
import { leftoverProcesses, repoRoot, run } from './helpers.ts'

const BOOTSTRAP = path.join(repoRoot, 'skills/presentation/templates/bootstrap')
const dirs: string[] = []
const tmp = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'and-scene-boot-'))
  dirs.push(dir)
  return dir
}

afterAll(() => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))))

describe('INT-001: the materialized bootstrap is complete and style-neutral', () => {
  it('installs from the lock file, lints, builds and renders its registered route outside the repository', async () => {
    const app = await tmp()
    await cp(BOOTSTRAP, app, { recursive: true, filter: (s) => !s.includes('node_modules') })
    const caller = await tmp() // run from an unrelated working directory
    expect(await detectAnchors(app)).toEqual({ build: true, kit: true, index: true })

    const install = await run('npm', ['ci', '--prefix', app], caller)
    expect(install.code, install.output).toBe(0)
    const lint = await run('npm', ['run', 'lint', '--prefix', app], caller)
    expect(lint.code, lint.output).toBe(0)
    const verify = await run('npm', ['run', 'verify', '--prefix', app], caller)
    expect(verify.output).toContain('PASS [build]')
    expect(verify.output).toContain('PASS [render] /starter: 3 steps')
    expect(verify.output).toMatch(/preview: http:\/\/127\.0\.0\.1:\d+/)
    expect(verify.code, verify.output).toBe(0)
    const inspect = await run('npm', ['run', 'inspect', '--prefix', app, '--', 'starter', '--no-build', '--settle', '1500'], caller)
    expect(inspect.code, inspect.output).toBe(0)
    expect(inspect.output).toContain('captured 3 screenshots')
    // the unstyled starter legitimately earns advisory warnings about unstyled active chrome and attribution
    expect(inspect.output).toContain('WARN step 1 indistinct active chrome')

    const installed = (await readdir(path.join(app, 'node_modules'))).concat(await readdir(path.join(app, 'node_modules/@types')))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', 'typescript', 'eslint', 'playwright', 'react', 'node']) {
      expect(installed, name).toContain(name)
    }
    expect(installed.filter((n) => /tailwind/i.test(n))).toEqual([])
    expect(await leftoverProcesses(app)).toBe('')
  })

  it('scaffolds an empty directory, installs dependencies and passes verification with a new presentation', async () => {
    const app = await tmp()
    const result = await detect(app)
    expect(result.missing).toEqual(['build', 'kit', 'index'])
    await apply(result.appDir, result.missing)
    await createPresentation(app, 'my-first-talk', 'My First Talk')
    const verify = await run('npm', ['run', 'verify'], app)
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toContain('PASS [render] /my-first-talk: 3 steps')
    const css = await readFile(path.join(app, 'src/presentations/my-first-talk/talk.css'), 'utf8')
    expect(css).toContain('.p-my-first-talk')
    expect(await leftoverProcesses(app)).toBe('')
  })
})
