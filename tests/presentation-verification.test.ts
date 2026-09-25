import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const run = (cwd: string, script = 'verify') => new Promise<{ code: number | null; output: string }>((resolve, reject) => {
  const child = spawn('npm', ['run', script, ...(script === 'inspect' ? ['--', 'how-to-make-a-presentation'] : [])], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk.toString() })
  child.stderr.on('data', (chunk) => { output += chunk.toString() })
  child.once('error', reject)
  child.once('exit', (code) => resolve({ code, output }))
})

const sample = 'src/presentations/how-to-make-a-presentation'

async function isolatedCopy<T>(name: string, edit: (directory: string) => Promise<void>, action: (directory: string) => Promise<T>) {
  const directory = await mkdtemp(path.join(tmpdir(), `and-scene-${name}-`))
  try {
    await cp(root, directory, { recursive: true, filter: (source) => !['.git', 'node_modules', 'dist', 'artifacts'].includes(path.basename(source)) })
    await symlink(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'dir')
    await edit(directory)
    return await action(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const isolatedFault = (name: string, edit: (directory: string) => Promise<void>) => isolatedCopy(name, edit, (directory) => run(directory))

async function buildAndInspect(directory: string) {
  expect((await run(directory, 'build')).code).toBe(0)
  const result = await run(directory, 'inspect')
  expect(result.code).toBe(0)
  return result
}

const editFile = (relative: string, change: (source: string) => string) => async (directory: string) => {
  const file = path.join(directory, relative)
  await writeFile(file, change(await readFile(file, 'utf8')))
}

describe('production verification failure contract', () => {

  it('captures controlled visual warning fixtures and exempts marked overlap', async () => {
    await isolatedCopy('inspect-fixture', async (directory) => {
      await editFile(`${sample}/steps/shared.tsx`, (scene) => scene.replace('<Box entityId="howto-ghost"', '<div data-presentation-allow-overlap=""><Box entityId="howto-ghost"').replace('… open step</Box><Box entityId="howto-depth"', '… open step</Box></div><Box entityId="howto-depth"'))(directory)
      await editFile(`${sample}/style.css`, (css) => `${css}\n.howto-ghost{left:35px;top:170px}.howto-depth{left:445px;top:170px}[data-presentation-progress-step][data-presentation-active="true"],[data-presentation-toc-entry][data-presentation-active="true"]{color:#b8c7c3;background:#14272e;border:1px solid #49616a;font-weight:400;box-shadow:none}[data-presentation-attribution]{font:8px Arial,sans-serif;color:#000}\n`)(directory)
    }, async (directory) => {
      const result = await buildAndInspect(directory)
      expect(result.output).toContain('step 5: overlapping visible nodes')
      expect(result.output).toContain('active progress/contents state is indistinct')
      expect(result.output).toContain('attribution missing, browser-default, or undersized')
      expect(result.output).not.toContain('… open step /')
      const screenshots = await readdir(path.join(directory, 'artifacts/inspection/how-to-make-a-presentation'))
      expect(screenshots).toHaveLength(9)
    })
  }, 180_000)

  it('reports scene content colliding with presentation chrome', async () => {
    const result = await isolatedCopy('inspect-chrome', editFile(`${sample}/style.css`, (css) => `${css}\n.presentation__attribution-slot{inset:0}[data-presentation-attribution]{display:block;width:100%;height:100%}\n`), buildAndInspect)
    expect(result.output).toMatch(/step 1: overlapping visible nodes: (YOU \/ made by and-scene|made by and-scene \/ YOU)/)
  }, 180_000)

  it('rejects a build fault with a build phase failure', async () => {
    const result = await isolatedFault('build-fault', editFile('src/presentations/how-to-make-a-presentation/Talk.tsx', (source) => `${source}\nthis is not valid TypeScript`))
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('FAIL [build]')
  }, 120_000)

  it('rejects a malformed canonical outline before browser startup', async () => {
    const result = await isolatedFault('outline-fault', editFile('src/presentations/how-to-make-a-presentation/steps/index.tsx', (source) => source.replace('You have a topic', 'Wrong first step')))
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('step 1: You have a topic')
  }, 120_000)

  it('rejects an out-of-order canonical outline before browser startup', async () => {
    const first = "['the ask','You have a topic','It starts with you, a topic, and mild overconfidence.']"
    const second = "['the ask','The skill interviews you','One question at a time: the topic, the look, then each beat of the story.']"
    const result = await isolatedFault('order-fault', editFile('src/presentations/how-to-make-a-presentation/steps/index.tsx', (source) => {
      expect(source).toContain(`${first},${second}`)
      return source.replace(`${first},${second}`, `${second},${first}`)
    }))
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('FAIL [sample validation]')
    expect(result.output).toContain('step 2: The skill interviews you')
  }, 120_000)

  it('names the step that emits a browser error', async () => {
    const result = await isolatedFault('runtime-fault', editFile('src/presentations/how-to-make-a-presentation/steps/shared.tsx', (source) => source.replace('return <SceneLayer', 'throw new Error("injected runtime fault")\n return <SceneLayer')))
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[route render\]: Browser error on step 1/)
  }, 120_000)

  it('names a stalled step transition and releases the preview port', async () => {
    const result = await isolatedFault('transition-fault', editFile('src/presentation-kit/usePresentationNav.ts', (source) => source.replace('goTo(activeIndex + 1)', 'goTo(activeIndex)')))
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('Failed transition at step 1 to 2')
  }, 120_000)
})
