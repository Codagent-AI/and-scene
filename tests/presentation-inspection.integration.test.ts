import { afterAll, describe, expect, it } from 'vitest'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = resolve(import.meta.dirname, '..')
let scratch = ''
const run = (args: string[], cwd: string) => spawnSync('npm', args, { cwd, encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024 })
afterAll(async () => { if (scratch) await rm(scratch, { recursive: true, force: true }) })

describe('project-local screenshot inspection (INT-002)', () => {
  it('captures every settled step and reports overlap, active-state, and attribution advisories', async () => {
    scratch = await mkdtemp(resolve(tmpdir(), 'and-scene-inspection-'))
    const app = resolve(scratch, 'app')
    await mkdir(resolve(app, 'scripts'), { recursive: true })
    await cp(resolve(repo, 'src'), resolve(app, 'src'), { recursive: true })
    await cp(resolve(repo, 'scripts/inspect-presentation.mjs'), resolve(app, 'scripts/inspect-presentation.mjs'))
    await cp(resolve(repo, 'scripts/inspection-diagnostics.mjs'), resolve(app, 'scripts/inspection-diagnostics.mjs'))
    for (const file of ['package.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) await cp(resolve(repo, file), resolve(app, file))
    await symlink(resolve(repo, 'node_modules'), resolve(app, 'node_modules'), 'dir')

    const cssFile = resolve(app, 'src/presentations/how-to-make-a-presentation/style.css')
    const css = await readFile(cssFile, 'utf8')
    await writeFile(cssFile, `${css}\n/* controlled advisory cases */\n.story-card { left: 25px !important; top: 215px !important; }\n.presentation-progress button, .presentation-progress button[aria-current="step"], .presentation-toc button, .presentation-toc button[aria-current="location"] { color: #fff !important; background: #eee !important; font-weight: 400 !important; outline: none !important; }\n.presentation-attribution { color: #0000ee; font-size: 9px; text-decoration: underline; }\n`)
    const build = run(['run', 'build'], app)
    expect(build.status, `${build.stdout}\n${build.stderr}`).toBe(0)

    const started = Date.now()
    const inspect = run(['run', 'inspect', '--', 'how-to-make-a-presentation'], app)
    const elapsed = Date.now() - started
    const output = `${inspect.stdout}\n${inspect.stderr}`
    expect(inspect.status, output).toBe(0)
    expect(output).toContain('WARNING step 4: possible overlap:')
    expect(output).toContain('active navigation may be visually indistinct')
    expect(output).toContain('attribution may be browser-default or undersized')
    expect(output).not.toContain('reveal-frame')
    expect(elapsed).toBeGreaterThanOrEqual(9 * 800)
    const images = await readdir(resolve(app, 'artifacts/inspection/how-to-make-a-presentation'))
    expect(images.filter(file => file.endsWith('.png'))).toHaveLength(9)
  }, 180_000)
})
