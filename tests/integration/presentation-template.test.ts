import { afterAll, describe, expect, it } from 'vitest'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const bootstrap = path.join(project, 'skills/presentation/templates/bootstrap')
const template = path.join(project, 'skills/presentation/templates/presentation')
const canonicalKit = path.join(project, 'src/presentation-kit')
let temporaryRoot = ''

function run(cwd: string, command: string, args: string[], timeout = 300000) {
  return new Promise<{ code: number; output: string }>((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => { output += chunk })
    child.stderr.setEncoding('utf8').on('data', (chunk) => { output += chunk })
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`timed out: ${command} ${args.join(' ')}`)) }, timeout)
    child.once('error', (error) => { clearTimeout(timer); reject(error) })
    child.once('exit', (code) => { clearTimeout(timer); resolve({ code: code ?? 1, output }) })
  })
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(root, entry.name)
    return entry.isDirectory() ? (await listFiles(target)).map((file) => path.join(entry.name, file)) : [entry.name]
  }))
  return nested.flat().sort()
}

describe('presentation bootstrap template', () => {
  afterAll(async () => { if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true }) })

  it('stays in parity with the canonical kit and portable scripts', async () => {
    const templateKit = path.join(bootstrap, 'src/presentation-kit')
    const canonicalFiles = (await listFiles(canonicalKit)).filter((file) => !file.endsWith('.test.tsx') && !file.endsWith('.test.ts'))
    expect(await listFiles(templateKit)).toEqual(canonicalFiles)
    for (const file of canonicalFiles) expect(await readFile(path.join(templateKit, file))).toEqual(await readFile(path.join(canonicalKit, file)))
    for (const file of ['verify.mjs', 'inspect-presentation.mjs', 'preview-process.mjs', 'preview-process.d.mts']) {
      expect(await readFile(path.join(bootstrap, 'scripts', file))).toEqual(await readFile(path.join(project, 'scripts', file)))
    }
  })

  it('materializes, installs, builds, and verifies a registered presentation from outside the source cwd', async () => {
    temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
    const skill = await readFile(path.join(project, 'skills/presentation/SKILL.md'), 'utf8')
    expect(skill).toContain('directory containing this')
    expect(skill).toContain("caller's working directory")
    expect(skill).toContain('A monorepo uses a self-contained app under `presentations/`')
    expect(skill).toContain('complete only the missing infrastructure')
    await cp(bootstrap, temporaryRoot, { recursive: true })
    await cp(template, path.join(temporaryRoot, 'src/presentations/sample'), { recursive: true })
    const talkPath = path.join(temporaryRoot, 'src/presentations/sample/Talk.tsx')
    const stepPath = path.join(temporaryRoot, 'src/presentations/sample/steps/step-01.tsx')
    await writeFile(talkPath, (await readFile(talkPath, 'utf8')).replace('Your presentation title', 'How an Evolving Scene Works'))
    await writeFile(stepPath, (await readFile(stepPath, 'utf8')).replace('A clear step title', 'Ideas take shape').replace('A concise sentence explaining this step.', 'A topic becomes one evolving visual explanation.').replace('Replace this scene with the first visual beat.', 'A topic becomes an evolving diagram.'))
    const registry = path.join(temporaryRoot, 'src/presentations/index.ts')
    const registrySource = await readFile(registry, 'utf8')
    await writeFile(registry, registrySource.replace('presentations: PresentationEntry[] = []', "presentations: PresentationEntry[] = [{ slug: 'sample', title: 'Sample', load: () => import('./sample/Talk') }]"))
    const packageJson = JSON.parse(await readFile(path.join(temporaryRoot, 'package.json'), 'utf8'))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'globals', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'typescript-eslint', 'playwright']) {
      expect(packageJson.dependencies?.[name] ?? packageJson.devDependencies?.[name], `${name} dependency`).toBeTruthy()
    }
    expect(packageJson.dependencies?.tailwindcss ?? packageJson.devDependencies?.tailwindcss).toBeUndefined()
    expect(Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies }).filter((name) => /tailwind/i.test(name))).toEqual([])
    expect(await readFile(path.join(temporaryRoot, 'scripts/reference-sample.json')).catch(() => '')).toBe('')
    const scaffoldCss = [
      await readFile(path.join(temporaryRoot, 'src/index.css'), 'utf8'),
      await readFile(path.join(template, 'presentation.css'), 'utf8'),
    ].join('\n')
    expect(scaffoldCss).not.toMatch(/(?:^|[;{\s])(?:color|font(?:-family)?|border|box-shadow|--[\w-]+)\s*:/im)
    const callerRoot = await mkdtemp(path.join(os.tmpdir(), 'and-scene-caller-'))
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const install = await run(callerRoot, npm, ['--prefix', temporaryRoot, 'ci'])
    expect(install.code, install.output).toBe(0)
    try {
      const build = await run(callerRoot, npm, ['--prefix', temporaryRoot, 'run', 'build'])
      expect(build.code, build.output).toBe(0)
      const verify = await run(callerRoot, npm, ['--prefix', temporaryRoot, 'run', 'verify'])
      expect(verify.code, verify.output).toBe(0)
      expect(verify.output).toContain('PASS verify')
      const inspect = await run(callerRoot, npm, ['--prefix', temporaryRoot, 'run', 'inspect', '--', 'sample', '--settle=25'])
      expect(inspect.code, inspect.output).toBe(0)
      expect(inspect.output).toContain('PASS inspect')
      expect(await readdir(path.join(temporaryRoot, '.and-scene/screenshots/sample'))).toEqual(['step-01.png'])
    } finally { await rm(callerRoot, { recursive: true, force: true }) }
  }, 600000)
})
