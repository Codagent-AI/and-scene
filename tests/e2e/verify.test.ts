import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import net from 'node:net'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const run = (cwd: string) => spawnSync('node', ['scripts/verify.mjs'], { cwd, encoding: 'utf8', timeout: 180_000 })
const output = (result: ReturnType<typeof run>) => `${result.stdout}\n${result.stderr}`
const sourceStatus = () => spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout

async function expectPreviewStopped(text: string) {
  const match = text.match(/http:\/\/127\.0\.0\.1:(\d+)\//)
  if (!match) return
  const port = Number(match[1])
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const listening = await new Promise<boolean>(resolve => {
      const socket = net.createConnection({ host: '127.0.0.1', port })
      socket.once('connect', () => { socket.destroy(); resolve(true) })
      socket.once('error', () => resolve(false))
    })
    if (!listening) return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error(`Preview port ${port} remained open after verification`)
}

describe('production verification', () => {
  it('passes the registered nine-step sample through the production browser', { timeout: 180_000 }, () => {
    const result = run(root)
    const text = output(result)
    expect(result.status, text).toBe(0)
    expect(text).toContain('[verify] PASS')
    expect(text).toContain('[verify] build:')
    expect(text).toContain('[verify] sample:')
    expect(text).toContain('[verify] render:')
    expect(text).toContain('9/9')
    expect(text).toContain('127.0.0.1')
    expect(text).not.toContain('localhost')
  })

  it('reports build, sample, runtime, and navigation faults without changing the source checkout', { timeout: 600_000 }, async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'and-scene-faults-'))
    const before = sourceStatus()
    const cases = [
      async (dir: string) => {
        const file = path.join(dir, 'src/presentations/how-to-make-a-presentation/Talk.tsx')
        await writeFile(file, `${await readFile(file, 'utf8')}\nconst broken: number = "type error";\n`)
        return ['build', undefined] as const
      },
      async (dir: string) => {
        const file = path.join(dir, 'src/presentations/index.ts')
        await writeFile(file, (await readFile(file, 'utf8')).replace('slug: "how-to-make-a-presentation"', 'slug: "missing-sample"'))
        return ['sample', undefined] as const
      },
      async (dir: string) => {
        const file = path.join(dir, 'src/presentations/how-to-make-a-presentation/steps.ts')
        const source = await readFile(file, 'utf8')
        const first = source.indexOf('  ["the ask", "You have a topic"')
        const second = source.indexOf('  ["the ask", "The skill interviews you"')
        const third = source.indexOf('\n', second)
        const firstLine = source.slice(first, source.indexOf('\n', first))
        const secondLine = source.slice(second, third)
        await writeFile(file, source.slice(0, first) + secondLine + '\n' + firstLine + source.slice(third))
        return ['sample', undefined] as const
      },
      async (dir: string) => {
        const scene = path.join(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
        await writeFile(scene, (await readFile(scene, 'utf8')).replace('export function Scene({ payload: { stage } }: SceneProps<StoryPayload>) {', 'export function Scene({ payload: { stage } }: SceneProps<StoryPayload>) {\n  if (stage === 2) console.error("injected render error");'))
        return ['render', 'step 2'] as const
      },
      async (dir: string) => {
        const file = path.join(dir, 'src/presentation-kit/usePresentationNav.ts')
        await writeFile(file, (await readFile(file, 'utf8')).replace('() => setStepIndex((i) => Math.min(stepCount - 1, i + 1))', '() => setStepIndex((i) => i)'))
        return ['render', 'step 2'] as const
      },
    ]
    try {
      for (const inject of cases) {
        const dir = path.join(temp, `case-${cases.indexOf(inject)}`)
        await cp(root, dir, { recursive: true, filter: source => !source.includes('/node_modules') && !source.includes('/dist') && !source.includes('/.git') && !source.includes('/.presentation-inspection') })
        await symlink(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
        const [phase, detail] = await inject(dir)
        const result = run(dir)
        const text = output(result)
        expect(result.status, text).not.toBe(0)
        expect(text).toContain(`FAIL phase=${phase}`)
        if (detail) expect(text).toContain(detail)
        await expectPreviewStopped(text)
      }
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
    expect(sourceStatus()).toBe(before)
  })
})
