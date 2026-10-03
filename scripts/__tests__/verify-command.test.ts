import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const source = process.cwd()
const excluded = new Set(['.git', 'node_modules', 'dist', 'validator_logs'])
const stepsFile = 'src/presentations/how-to-make-a-presentation/steps.tsx'
const copies: string[] = []

async function disposableCopy() {
  const root = await mkdtemp(join(tmpdir(), 'and-scene-verify-command-'))
  copies.push(root)
  await cp(source, root, { recursive: true, filter: (path) => !excluded.has(relative(source, path).split(/[\\/]/)[0]) })
  // Link dependencies individually so build caches in node_modules/.tmp stay private to the copy.
  await mkdir(join(root, 'node_modules/.tmp'), { recursive: true })
  for (const entry of await readdir(join(source, 'node_modules'))) {
    if (entry === '.tmp' || entry === '.vite') continue
    await symlink(join(source, 'node_modules', entry), join(root, 'node_modules', entry))
  }
  return root
}

function runVerify(root: string) {
  return new Promise<{ code: number | null; output: string }>((resolve) => {
    const child = spawn(process.execPath, ['scripts/verify.mjs'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('close', (code) => resolve({ code, output }))
  })
}

afterEach(async () => { await Promise.all(copies.splice(0).map((root) => rm(root, { recursive: true, force: true }))) })

describe('npm run verify fault reporting from disposable copies', () => {
  it('fails the build phase for a build-breaking edit', async () => {
    const root = await disposableCopy()
    await writeFile(join(root, 'src/main.tsx'), `${await readFile(join(root, 'src/main.tsx'), 'utf8')}\nconst broken: number = 'not a number'\nexport { broken }\n`)
    const { code, output } = await runVerify(root)
    expect(code).not.toBe(0)
    expect(output).toContain('FAIL: build check failed')
    expect(output).not.toContain('PASS: verification complete')
  }, 180000)

  it('fails the reference sample phase when the sample is missing', async () => {
    const root = await disposableCopy()
    await rm(join(root, 'src/presentations/how-to-make-a-presentation'), { recursive: true })
    const registry = await readFile(join(root, 'src/presentations/index.ts'), 'utf8')
    await writeFile(join(root, 'src/presentations/index.ts'), registry.replace(/^\s*\{ slug: 'how-to-make-a-presentation'.*\n/m, ''))
    const { code, output } = await runVerify(root)
    expect(code).not.toBe(0)
    expect(output).toContain('PASS: whole application build')
    expect(output).toContain('FAIL: reference sample check')
    expect(output).not.toContain('PASS: verification complete')
  }, 180000)

  it('fails the reference sample phase when steps are out of order', async () => {
    const root = await disposableCopy()
    const steps = await readFile(join(root, stepsFile), 'utf8')
    const first = "  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],\n"
    const second = "  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],\n"
    expect(steps).toContain(first + second)
    await writeFile(join(root, stepsFile), steps.replace(first + second, second + first))
    const { code, output } = await runVerify(root)
    expect(code).not.toBe(0)
    expect(output).toContain('FAIL: reference sample check')
    expect(output).toContain('step 1 title must be "You have a topic"')
    expect(output).not.toContain('PASS: verification complete')
    expect(await readFile(join(source, stepsFile), 'utf8')).toContain(first + second)
  }, 180000)
})
