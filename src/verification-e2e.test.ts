import { mkdtemp, cp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repository = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceFiles = ['index.html', 'package.json', 'tsconfig.app.json', 'tsconfig.json', 'tsconfig.node.json', 'vite.config.ts', 'src', 'scripts']
let nextPort = 4281

async function fixture(mutator: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), 'and-scene-verify-'))
  for (const source of sourceFiles) await cp(join(repository, source), join(directory, source), { recursive: true })
  await symlink(join(repository, 'node_modules'), join(directory, 'node_modules'), 'dir')
  await replace(directory, 'scripts/verify.mjs', 'const port = 4173', `const port = ${nextPort++}`)
  await mutator(directory)
  return directory
}

function runVerify(directory: string) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/verify.mjs'], { cwd: directory })
    let output = ''
    child.stdout.on('data', (chunk) => { output += String(chunk) })
    child.stderr.on('data', (chunk) => { output += String(chunk) })
    child.once('error', reject)
    child.once('close', (code) => resolve({ code, output }))
  })
}

async function replace(directory: string, relativePath: string, from: string, to: string) {
  const path = join(directory, relativePath)
  const source = await readFile(path, 'utf8')
  await writeFile(path, source.replace(from, to))
}

describe('production verification fault reporting', () => {
  it('returns actionable non-zero failures for isolated build, sample, browser, and transition faults', async () => {
    const buildFault = await fixture((directory) => replace(directory, 'src/presentations/how-to-make-a-presentation/entities.ts', "const prefix = 'how-to-make-a-presentation'", 'const prefix: number = \'invalid\''))
    const missingSampleFault = await fixture((directory) => replace(directory, 'src/presentations/index.ts', "slug: 'how-to-make-a-presentation'", "slug: 'missing-sample'"))
    const eraFault = await fixture((directory) => replace(directory, 'src/presentations/how-to-make-a-presentation/steps.tsx', "['you-have-a-topic', 'the ask'", "['you-have-a-topic', 'wrong era'"))
    const browserFault = await fixture((directory) => replace(directory, 'src/presentations/how-to-make-a-presentation/Talk.tsx', 'export default function Talk() {', "export default function Talk() { console.error('injected browser fault')"))
    const transitionFault = await fixture(async (directory) => {
      await replace(directory, 'scripts/verify.mjs', "await page.keyboard.press('ArrowRight')", 'await Promise.resolve()')
      await replace(directory, 'scripts/verify.mjs', "if (errors.length) throw new Error(errors.join('; '))", "if (false) throw new Error(errors.join('; '))")
    })

    try {
      const build = await runVerify(buildFault)
      expect(build.code).not.toBe(0)
      expect(build.output).toContain('FAIL: build failed')

      const missing = await runVerify(missingSampleFault)
      expect(missing.code).not.toBe(0)
      expect(missing.output).toContain('sample outline failed')

      const era = await runVerify(eraFault)
      expect(era.code).not.toBe(0)
      expect(era.output).toContain('expected canonical era "the ask"')

      const browser = await runVerify(browserFault)
      expect(browser.code).not.toBe(0)
      expect(browser.output).toContain('console at step 1: injected browser fault')

      const transition = await runVerify(transitionFault)
      expect(transition.code).not.toBe(0)
      expect(transition.output).toContain('transition failed at step 2')
    } finally {
      await Promise.all([buildFault, missingSampleFault, eraFault, browserFault, transitionFault].map((directory) => rm(directory, { force: true, recursive: true })))
    }
  }, 120_000)
})
