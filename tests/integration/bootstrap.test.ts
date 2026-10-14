import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it, onTestFinished } from 'vitest'

// Resolve from this test's location, never the materialized app's working directory.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
async function run(dir: string, args: string[]) {
  return new Promise<{ code: number; output: string }>((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
      cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
    })
    let output = ''
    child.stdout.on('data', data => { output += data })
    child.stderr.on('data', data => { output += data })
    const stop = () => { try { process.kill(-child.pid!, 'SIGTERM') } catch { /* exited */ } }
    const timer = setTimeout(stop, 180000)
    onTestFinished(async () => {
      if (child.exitCode !== null || child.signalCode !== null) return
      stop()
      await new Promise<void>(done => child.once('close', () => done()))
    })
    child.on('error', error => { clearTimeout(timer); reject(error) })
    child.on('close', code => { clearTimeout(timer); resolve({ code: code ?? 1, output }) })
  })
}

it('INT-001 installs, lints, builds and verifies empty and registered materialized apps outside the repository', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  onTestFinished(() => rm(dir, { recursive: true, force: true }))
  await cp(join(root, 'skills/presentation/templates/bootstrap'), dir, { recursive: true })
  const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) {
    expect(dependencies[name], name).toBeTruthy()
  }
  expect(Object.keys(dependencies).join(' ')).not.toMatch(/tailwind|bootstrap|styled-components|@emotion/i)
  const kit = 'src/presentation-kit'
  const canonicalFiles = (await readdir(join(root, kit), { recursive: true })).sort()
  expect((await readdir(join(dir, kit), { recursive: true })).sort()).toEqual(canonicalFiles)
  for (const file of canonicalFiles.filter(file => /\.(tsx?|md)$/.test(file))) {
    expect(await readFile(join(dir, kit, file))).toEqual(await readFile(join(root, kit, file)))
  }
  const css = await readFile(join(dir, 'src/index.css'), 'utf8')
  expect(css).not.toMatch(/(?:color|background[\w-]*|font[\w-]*|border[\w-]*|[\w-]*shadow)\s*:/)
  const install = await run(dir, ['ci', '--no-audit', '--no-fund'])
  expect(install.code, install.output).toBe(0)
  const empty = await run(dir, ['run', 'verify'])
  expect(empty.code, empty.output).toBe(0)
  expect(empty.output).toContain('0 presentations')
  await cp(join(root, 'skills/presentation/templates/presentation'), join(dir, 'src/presentations/starter'), { recursive: true })
  const registry = join(dir, 'src/presentations/index.ts')
  await writeFile(registry, (await readFile(registry, 'utf8')).replace('= []', "= [\n  { slug: 'starter', title: 'An evolving scene', load: () => import('./starter/Talk') },\n]"))
  const lint = await run(dir, ['run', 'lint'])
  expect(lint.code, lint.output).toBe(0)
  const registered = await run(dir, ['run', 'verify'])
  expect(registered.code, registered.output).toBe(0)
  expect(registered.output).toContain('starter step 0 OK')
  expect(registered.output).toContain('starter step 1 OK')
  expect(registered.output).toContain('PASS')
  const inspect = await run(dir, ['run', 'inspect', '--', 'starter'])
  expect(inspect.code, inspect.output).toBe(0)
  expect(inspect.output).toContain('PASS captured 2 settled steps')
}, 600000)
