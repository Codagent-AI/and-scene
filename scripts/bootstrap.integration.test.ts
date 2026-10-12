import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')
const run = (command: string, args: string[], cwd: string) => execFileSync(command, args, { cwd, stdio: 'pipe', encoding: 'utf8', env: { ...process.env, CI: '1' } })
async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => walk(path.join(dir, entry.name))))
  return [...nested.flat(), ...entries.filter((entry) => entry.isFile()).map((entry) => path.join(dir, entry.name))]
}

describe('INT-001 materialized bootstrap', () => {
  it('installs from its lockfile, builds, smoke-verifies, and remains style-neutral', async () => {
    const target = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
    try {
      await cp(bootstrap, target, { recursive: true })
      const manifest = JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8'))
      const allDependencies = { ...manifest.dependencies, ...manifest.devDependencies }
      for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'typescript-eslint', 'globals', 'playwright', 'vitest']) expect(allDependencies).toHaveProperty(dependency)
      expect(manifest.scripts).toMatchObject({ build: expect.any(String), verify: expect.any(String), inspect: expect.any(String) })
      expect(manifest.dependencies && JSON.stringify(manifest).toLowerCase()).not.toContain('tailwind')

      run('npm', ['ci', '--offline'], target)
      run('npm', ['run', 'build'], target)
      try { run('npm', ['run', 'verify'], target) } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        if (/executable.*doesn.t exist|browser.*not found|chromium/i.test(detail)) throw new Error(`INT-001 requires Playwright Chromium. Install it with "npx playwright install chromium". ${detail}`, { cause: error })
        throw new Error(detail, { cause: error })
      }

      for (const anchor of ['vite.config.ts', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts']) expect(await readFile(path.join(target, anchor), 'utf8')).toBeTruthy()
      for (const script of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) expect(await readFile(path.join(target, script))).toEqual(await readFile(path.join(root, script)))
      for (const file of await walk(path.join(root, 'src/presentation-kit'))) {
        if (/\.test\.[jt]sx?$/.test(file)) continue
        const relative = path.relative(root, file)
        expect(await readFile(path.join(target, relative))).toEqual(await readFile(file))
      }

      const appFiles = (await walk(target)).filter((file) => !file.startsWith(path.join(target, 'node_modules') + path.sep) && !file.startsWith(path.join(target, 'dist') + path.sep))
      const cssFiles = appFiles.filter((file) => file.endsWith('.css'))
      expect(cssFiles.length).toBeGreaterThan(0)
      const stylePattern = /\b(color|background(?:-color)?|font(?:-family|-size|-weight)?|padding|margin|gap|border(?:-radius|-color|-width)?|box-shadow|text-shadow)\s*:/i
      for (const file of cssFiles) expect(await readFile(file, 'utf8'), path.relative(target, file)).not.toMatch(stylePattern)
      for (const file of appFiles.filter((file) => /\.[jt]sx?$/.test(file))) {
        const source = await readFile(file, 'utf8')
        expect(source, path.relative(target, file)).not.toMatch(/tailwind/i)
        for (const [, inlineStyle] of source.matchAll(/style=\{\{([\s\S]*?)\}\}/g)) expect(inlineStyle).not.toMatch(stylePattern)
      }
      expect(await readFile(path.join(target, 'src/index.css'), 'utf8')).toMatch(/box-sizing/)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (/Chromium|executable doesn't exist|browserType\.launch/i.test(message)) throw new Error(`INT-001 could not launch Chromium. Install it with "npx playwright install chromium". ${message}`, { cause: error })
      throw new Error(message, { cause: error })
    } finally { await rm(target, { recursive: true, force: true }) }
  }, 240_000)
})
