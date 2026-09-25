import { cp, mkdtemp, rm, symlink, readFile, writeFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const exec = promisify(execFile)
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function materialize(temp: string) {
  const app = join(temp, 'app')
  await cp(repo, app, { recursive: true, filter: (source) => !relative(repo, source).split(sep).some((part) => ['node_modules', '.git', 'dist', 'artifacts', '.vite'].includes(part)) })
  await symlink(join(repo, 'node_modules'), join(app, 'node_modules'), 'dir')
  return app
}

async function command(app: string, args: string[]) {
  try {
    const port = String(5000 + Math.floor(Math.random() * 20000))
    const result = await exec('node', args, { cwd: app, timeout: 120_000, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, PORT: port } })
    return { code: 0, output: `${result.stdout}\n${result.stderr}` }
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string; message: string }
    return { code: Number(failure.code ?? 1), output: `${failure.stdout ?? ''}\n${failure.stderr ?? ''}\n${failure.message}` }
  }
}

describe('project browser verification (INT-002, E2E-002)', () => {
  it('captures settled fixture steps and diagnoses overlap, active chrome and attribution', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'and-scene-inspect-'))
    try {
      const app = await materialize(temp)
      const presentation = join(app, 'src/presentation-kit/Presentation.tsx')
      let source = await readFile(presentation, 'utf8')
      source = source.replace('<Stage step={step}', '<div className="fixture-collision">fixture overlap</div><div data-presentation-allow-overlap className="fixture-allowed">intentional overlap</div><Stage step={step}')
      await writeFile(presentation, source)
      const css = join(app, 'src/presentations/how-to-make-a-presentation/presentation.css')
      await writeFile(css, `${await readFile(css, 'utf8')}\n.fixture-collision,.fixture-allowed{position:absolute;left:24px;top:510px;z-index:5;color:#fff}.fixture-allowed{top:530px}[data-presentation-root] [data-presentation-active="true"],[data-presentation-root] [data-presentation-active="false"]{color:#f5f0e6!important;background:#202b25!important;border-color:#617469!important;font-weight:600!important}[data-presentation-attribution]{font-size:8px!important}\n`)
      await exec('npm', ['run', 'build'], { cwd: app, timeout: 120_000, maxBuffer: 4 * 1024 * 1024 })
      const result = await command(app, [join(app, 'scripts/inspect-presentation.mjs'), '/how-to-make-a-presentation'])
      expect(result.code, result.output).toBe(0)
      expect(result.output).toContain('Captured 9 settled screenshots')
      const screenshots = await readdir(join(app, 'artifacts/presentation-inspection/how-to-make-a-presentation'))
      expect(screenshots.filter((file) => file.endsWith('.png'))).toHaveLength(9)
      expect(result.output).toContain('unmarked visible text/chrome overlap')
      expect(result.output).toContain('active progress state is visually indistinct')
      expect(result.output).toContain('attribution is undersized')
      expect(result.output).not.toContain('intentional overlap”')
    } finally { await rm(temp, { recursive: true, force: true }) }
  }, 240_000)

  it.each([
    ['build failure', async (app: string) => writeFile(join(app, 'src/fault.ts'), 'const invalid: number = "broken"; export default invalid;'), /building whole application|build/i],
    ['missing registry entry', async (app: string) => {
      const path = join(app, 'src/presentations/index.ts')
      await writeFile(path, (await readFile(path, 'utf8')).replace("  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },\n", ''))
    }, /sample is missing from presentation registry/],
    ['browser runtime error', async (app: string) => {
      const path = join(app, 'src/presentations/how-to-make-a-presentation/steps/StoryScene.tsx')
      await writeFile(path, (await readFile(path, 'utf8')).replace('  return <div className="story"', "  if (index === 2) throw new Error('fixture render failure')\n  return <div className=\"story\""))
    }, /step 2 (uncaught|console|transition failed)/],
    ['failed transition', async (app: string) => {
      const path = join(app, 'src/presentation-kit/usePresentationNav.ts')
      await writeFile(path, (await readFile(path, 'utf8')).replace('const next = useCallback(() => goTo(index + 1), [goTo, index])', 'const next = useCallback(() => {}, [])'))
    }, /step 1 transition failed/],
  ])('reports an actionable nonzero result for %s in an isolated copy', async (_name, inject, expected) => {
    const temp = await mkdtemp(join(tmpdir(), 'and-scene-fault-'))
    try {
      const app = await materialize(temp)
      await inject(app)
      const result = await command(app, [join(app, 'scripts/verify.mjs')])
      expect(result.code, result.output).not.toBe(0)
      expect(result.output).toMatch(expected)
      expect(result.output).not.toContain('PASS: built app')
    } finally { await rm(temp, { recursive: true, force: true }) }
  }, 240_000)
})
