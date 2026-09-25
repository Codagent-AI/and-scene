import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repo = resolve(import.meta.dirname, '..')
const appFiles = ['index.html', 'package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'src', 'scripts']

function createCopy(root: string, name: string) {
  const app = join(root, name)
  for (const path of appFiles) cpSync(join(repo, path), join(app, path), { recursive: true })
  symlinkSync(join(repo, 'node_modules'), join(app, 'node_modules'), 'dir')
  return app
}

function runVerification(app: string) {
  try {
    execFileSync('npm', ['run', 'verify'], { cwd: app, encoding: 'utf8', timeout: 180_000 })
    return { code: 0, output: '' }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { code: failure.status ?? 1, output: `${failure.stdout ?? ''}${failure.stderr ?? ''}` }
  }
}

describe('production verification failure contract', () => {
  it('reports isolated build, sample, browser, and transition faults without modifying this checkout', () => {
    const temp = mkdtempSync(join(tmpdir(), 'and-scene-verify-faults-'))
    try {
      const build = createCopy(temp, 'build-fault')
      writeFileSync(join(build, 'src/main.tsx'), 'this is not valid TypeScript')
      const buildResult = runVerification(build)
      expect(buildResult.code).not.toBe(0)
      expect(buildResult.output).toMatch(/Build check failed/i)

      const missing = createCopy(temp, 'missing-sample')
      const missingRegistry = readFileSync(join(missing, 'src/presentations/index.ts'), 'utf8').replace('how-to-make-a-presentation', 'missing-sample')
      writeFileSync(join(missing, 'src/presentations/index.ts'), missingRegistry)
      const missingResult = runVerification(missing)
      expect(missingResult.code).not.toBe(0)
      expect(missingResult.output).toMatch(/Sample registration check failed/i)

      const browserFault = createCopy(temp, 'browser-fault')
      const sceneFile = join(browserFault, 'src/presentations/how-to-make-a-presentation/steps/index.tsx')
      const source = readFileSync(sceneFile, 'utf8')
      writeFileSync(sceneFile, source.replace('  return <SceneLayer className="sample-scene">', "  console.error('fixture browser fault')\n  return <SceneLayer className=\"sample-scene\">"))
      const browserResult = runVerification(browserFault)
      expect(browserResult.code).not.toBe(0)
      expect(browserResult.output).toMatch(/Browser render failed at step 1/i)

      const transition = createCopy(temp, 'transition-fault')
      const verifyFile = join(transition, 'scripts/verify.mjs')
      const verify = readFileSync(verifyFile, 'utf8').replace('  for (let index = 0; index < count; index += 1) {', "  await page.locator('[data-presentation-mode-toggle]').focus()\n  for (let index = 0; index < count; index += 1) {")
      writeFileSync(verifyFile, verify)
      const transitionResult = runVerification(transition)
      expect(transitionResult.code).not.toBe(0)
      expect(transitionResult.output).toMatch(/VERIFY FAILED during step \d+/i)
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }, 240_000)
})
