import { beforeAll, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const bootstrap = path.join(repo, 'skills/presentation/templates/bootstrap')
const skillScripts = path.join(repo, 'skills/presentation/scripts')
let app = ''
const outcomes: Record<string, string> = {}
function command(cmd: string, args: string[], cwd: string, extraEnv: NodeJS.ProcessEnv = {}) {
  return new Promise<{ code: number; output: string }>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.on('error', reject)
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}
function assertSuccess(name: string, result: { code: number; output: string }) {
  outcomes[name] = result.code === 0 ? 'passed' : `failed (${result.code})\n${result.output}`
  expect(result.code, `${name}: ${result.output}`).toBe(0)
}
async function files(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.name === '__tests__' || item.name.endsWith('.test.ts') || item.name.endsWith('.test.tsx')) continue
    const absolute = path.join(directory, item.name)
    if (item.isDirectory()) result.push(...(await files(absolute)).map((name) => path.join(item.name, name)))
    else result.push(item.name)
  }
  return result.sort()
}
async function compareTrees(left: string, right: string) {
  const leftFiles = await files(left); const rightFiles = await files(right)
  expect(leftFiles).toEqual(rightFiles)
  for (const relative of leftFiles) expect(await readFile(path.join(left, relative))).toEqual(await readFile(path.join(right, relative)))
}

describe('INT-001 standalone bootstrap materialization', () => {
  beforeAll(async () => {
    app = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
    const scaffold = await command(process.execPath, [path.join(skillScripts, 'scaffold.mjs'), '--target', app, '--anchors', 'all'], os.tmpdir())
    assertSuccess('scaffold', scaffold)
    const cache = process.env.npm_config_cache || path.join(os.homedir(), '.npm')
    const ci = await command('npm', ['ci', '--prefer-offline', '--cache', cache], app)
    assertSuccess('npm ci', ci)
    assertSuccess('initial build', await command('npm', ['run', 'build'], app))
    assertSuccess('new presentation', await command(process.execPath, [path.join(skillScripts, 'new-presentation.mjs'), '--target', app, '--slug', 'bootstrap-example', '--title', 'Bootstrap Example'], os.tmpdir()))
    assertSuccess('bootstrap verify', await command('npm', ['run', 'verify'], app, { PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROME_PATH || '' }))
    const inspect = await command('npm', ['run', 'inspect', '--', 'bootstrap-example', '--settle', '10', '--out', '.inspection-test'], app, { PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROME_PATH || '' })
    assertSuccess('project-local inspect', inspect)
    expect(inspect.output).toContain('captured step 3/3')
  }, 300000)

  it('materializes all anchors and the full dependency set without styling-framework defaults', async () => {
    expect(await stat(path.join(app, 'package.json'))).toBeDefined()
    expect(await stat(path.join(app, 'src/presentation-kit/types.ts'))).toBeDefined()
    expect(await stat(path.join(app, 'src/presentations/index.ts'))).toBeDefined()
    const pkg = JSON.parse(await readFile(path.join(app, 'package.json'), 'utf8'))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[name]).toBeDefined()
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', '@eslint/js', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright']) expect(pkg.devDependencies[name]).toBeDefined()
    const forbidden = await Promise.all(['package.json', 'vite.config.ts', 'src/index.css'].map((name) => readFile(path.join(app, name), 'utf8')))
    expect(forbidden.join('\n')).not.toMatch(/tailwind/i)
    const kit = (await files(path.join(app, 'src/presentation-kit'))).join('\n')
    expect(kit).not.toMatch(/#[0-9a-f]{3,8}\b|font-family|box-shadow|border:\s*\d|--(?:color|font|shadow|border)/i)
    expect(forbidden[2]).toContain('Host reset only')
  })

  it('keeps canonical kit and verification/inspection scripts byte aligned', async () => {
    await compareTrees(path.join(repo, 'src/presentation-kit'), path.join(bootstrap, 'src/presentation-kit'))
    expect(await readFile(path.join(repo, 'scripts/inspect-presentation.mjs'))).toEqual(await readFile(path.join(bootstrap, 'scripts/inspect-presentation.mjs')))
    expect(await readFile(path.join(repo, 'scripts/verify.mjs'))).toEqual(await readFile(path.join(bootstrap, 'scripts/verify.mjs')))
    expect(await stat(path.join(repo, 'verify.config.json'))).toBeDefined()
    await expect(stat(path.join(bootstrap, 'verify.config.json'))).rejects.toThrow()
    expect(outcomes['npm ci']).toBe('passed')
    await rm(app, { recursive: true, force: true })
  })
})
