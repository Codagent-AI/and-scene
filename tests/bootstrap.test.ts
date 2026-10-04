import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const root = path.resolve(import.meta.dirname, '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

async function filesBelow(directory: string): Promise<string[]> {
  const children = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(children.map((child) => child.isDirectory()
    ? filesBelow(path.join(directory, child.name)).then((files) => files.map((file) => `${child.name}/${file}`))
    : [child.name]))
  return nested.flat()
}

describe('distributable bootstrap', () => {
  it('materializes, builds, verifies its route outside this repository, and matches the canonical kit', async () => {
    const temp = await mkdtemp(path.join(tmpdir(), 'and-scene-bootstrap-'))
    const app = path.join(temp, 'app')
    const outside = path.join(temp, 'caller')
    try {
      await cp(bootstrap, app, { recursive: true, filter: (source) => !source.split(path.sep).includes('node_modules') && !source.split(path.sep).includes('dist') })
      await import('node:fs/promises').then(({ mkdir }) => mkdir(outside))

      const pkg = JSON.parse(await readFile(path.join(app, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
      for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[name]).toBeTruthy()
      for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) expect(pkg.devDependencies[name]).toBeTruthy()
      expect(`${JSON.stringify(pkg)} ${await readFile(path.join(app, 'package-lock.json'), 'utf8')}`).not.toMatch(/tailwind/i)

      const canonicalKit = path.join(root, 'src/presentation-kit')
      const templateKit = path.join(app, 'src/presentation-kit')
      const kitFiles = (await filesBelow(canonicalKit)).sort()
      expect((await filesBelow(templateKit)).sort()).toEqual(kitFiles)
      for (const file of kitFiles) expect(await readFile(path.join(templateKit, file))).toEqual(await readFile(path.join(canonicalKit, file)))

      const cssFiles = (await filesBelow(path.join(app, 'src'))).filter((file) => file.endsWith('.css'))
      const css = (await Promise.all(cssFiles.map((file) => readFile(path.join(app, 'src', file), 'utf8')))).join('\n')
      expect(css).not.toMatch(/tailwind|--(?:theme|color|font|space)-|#(?:[0-9a-f]{3,8})\b|\b(?:border|box-shadow|font-family)\s*:/i)

      await execFileAsync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app, timeout: 240_000 })
      await execFileAsync('npm', ['run', 'lint'], { cwd: app, timeout: 120_000 })
      await execFileAsync('npm', ['run', 'build'], { cwd: app, timeout: 120_000 })
      const colorEnv = { ...process.env, FORCE_COLOR: '1' }
      delete colorEnv.NO_COLOR
      // Run from a caller directory outside both the app and this source checkout.
      const { stdout, stderr } = await execFileAsync('npm', ['--prefix', app, 'run', 'verify', '--', 'example'], { cwd: outside, timeout: 180_000, env: colorEnv })
      expect(`${stdout}\n${stderr}`).toContain('PASS: build and first-step render for /example')
      const inspection = await execFileAsync('npm', ['--prefix', app, 'run', 'inspect', '--', 'example'], { cwd: outside, timeout: 180_000, env: colorEnv })
      expect(`${inspection.stdout}\n${inspection.stderr}`).toContain('PASS: captured 1 settled screenshots')
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  }, 600_000)
})
