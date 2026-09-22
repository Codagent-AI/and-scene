import { execFileSync, spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const bootstrap = join(repo, 'skills/presentation/templates/bootstrap')
const kit = join(repo, 'src/presentation-kit')
const read = (path: string) => readFileSync(path, 'utf8')

describe('distributable bootstrap (INT-001)', () => {
  it('materializes, builds, and verifies independently of the caller directory', async () => {
    const temp = mkdtempSync(join(tmpdir(), 'and-scene-bootstrap-'))
    try {
      cpSync(bootstrap, temp, { recursive: true })
      const pkg = JSON.parse(read(join(temp, 'package.json')))
      expect(pkg.dependencies).toMatchObject({ react: expect.any(String), 'react-dom': expect.any(String), motion: expect.any(String), 'lucide-react': expect.any(String) })
      expect(pkg.devDependencies).toMatchObject({ vite: expect.any(String), '@vitejs/plugin-react': expect.any(String), typescript: expect.any(String), playwright: expect.any(String), eslint: expect.any(String), '@types/node': expect.any(String), '@types/react': expect.any(String), '@types/react-dom': expect.any(String) })
      expect(pkg.scripts).toMatchObject({ build: expect.any(String), lint: expect.any(String), verify: expect.any(String), inspect: expect.any(String) })
      const files = (dir: string, base = dir): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name)
        return entry.isDirectory() ? files(path, base) : entry.name.endsWith('.test.tsx') ? [] : [path.slice(base.length + 1)]
      }).sort()
      expect(files(join(temp, 'src/presentation-kit'))).toEqual(files(kit))
      for (const name of files(kit)) expect(read(join(temp, 'src/presentation-kit', name))).toBe(read(join(kit, name)))
      expect(() => read(join(temp, 'package-lock.json'))).not.toThrow()
      execFileSync('npm', ['ci', '--ignore-scripts'], { cwd: temp, stdio: 'pipe' })
      expect(read(join(temp, 'package.json'))).not.toMatch(/tailwind/i)
      expect(read(join(temp, 'src/index.css'))).not.toMatch(/#[\da-f]{3,8}|font-family|--[\w-]+\s*:/i)
      execFileSync('npm', ['run', 'lint'], { cwd: temp, stdio: 'pipe' })
      const startForeign = async (port: number, html: string) => {
        const child = spawn(process.execPath, ['-e', `const [html, port] = process.argv.slice(1); require('node:http').createServer((_req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(html) }).listen(Number(port), '127.0.0.1')`, html, String(port)], { stdio: 'ignore' })
        await new Promise<void>((resolveSpawn, rejectSpawn) => { child.once('spawn', resolveSpawn); child.once('error', rejectSpawn) })
        for (let attempt = 0; attempt < 20; attempt++) {
          try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) return child } catch (error) { if (attempt === 19) throw error }
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 50))
        }
        child.kill('SIGTERM')
        throw new Error(`foreign server did not start on ${port}`)
      }
      const stopForeign = async (child: ReturnType<typeof spawn>) => { child.kill('SIGTERM'); await new Promise<void>((resolveExit) => child.once('exit', () => resolveExit())) }
      const foreign = await startForeign(4179, '<!doctype html><main data-step-count="1" data-step-index="0"></main><script>console.error("foreign preview served")</script>')
      try {
        const invokedOutside = execFileSync('node', [join(temp, 'scripts/verify.mjs')], { cwd: tmpdir(), encoding: 'utf8', stdio: 'pipe' })
        expect(invokedOutside).toMatch(/PASS/i)
      } finally {
        await stopForeign(foreign)
      }
      const foreignInspect = await startForeign(4180, '<!doctype html><p>unrelated server</p>')
      try {
        execFileSync('npm', ['run', 'inspect', '--', 'starter'], { cwd: temp, stdio: 'pipe' })
      } finally {
        await stopForeign(foreignInspect)
      }
      expect(readdirSync(join(temp, 'artifacts/presentations/starter'))).toContain('step-01.png')
      writeFileSync(join(temp, 'src/presentations/broken.tsx'), 'export default function Broken(): never { throw new Error("broken route render") }\n')
      writeFileSync(join(temp, 'src/presentations/index.ts'), `${read(join(temp, 'src/presentations/index.ts'))}\npresentations.push({ slug: 'broken', title: 'Broken fixture', load: () => import('./broken') })\n`)
      let failedVerification = ''
      try { execFileSync('node', [join(temp, 'scripts/verify.mjs')], { cwd: tmpdir(), encoding: 'utf8', stdio: 'pipe' }) } catch (error) {
        const failure = error as { stdout?: string; stderr?: string }
        failedVerification = `${failure.stdout ?? ''}${failure.stderr ?? ''}`
      }
      expect(failedVerification).toContain('/broken')
      expect(failedVerification).toContain('broken route render')
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }, 300000)
})
