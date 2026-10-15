import { afterEach, describe, expect, it } from 'vitest'
import { chmod, cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
const execFileAsync = promisify(execFile)

const root = process.cwd()
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')
const tempDirs: string[] = []
async function temp() { const dir = await mkdtemp(path.join(os.tmpdir(), 'and-scene-template-')); tempDirs.push(dir); return dir }
afterEach(async () => { await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))) })

function invoke(args: string[]) { return spawnSync(process.execPath, ['scripts/sync-templates.mjs', ...args], { cwd: root, encoding: 'utf8' }) }

describe('presentation bootstrap template', () => {
  it('contains a valid skill contract and every referenced template', async () => {
    const skill = await readFile(path.join(root, 'skills/presentation/SKILL.md'), 'utf8')
    expect(skill).toMatch(/^---\nname: presentation\ndescription: .+\n---/)
    for (const phrase of ['one concise question at a time', 'build with what we have', 'wait for confirmation', 'pnpm-workspace.yaml', 'under `presentations/`', "relative to this file's directory", 'npm run inspect -- <slug>', 'data-presentation-allow-overlap', 'Fix failures and re-check']) expect(skill).toContain(phrase)
    for (const file of [
      'templates/bootstrap/package.json', 'templates/bootstrap/package-lock.json', 'templates/bootstrap/index.html',
      'templates/bootstrap/vite.config.ts', 'templates/bootstrap/tsconfig.app.json', 'templates/bootstrap/tsconfig.node.json',
      'templates/bootstrap/eslint.config.js', 'templates/bootstrap/.gitignore', 'templates/bootstrap/src/main.tsx',
      'templates/bootstrap/src/Landing.tsx', 'templates/bootstrap/src/index.css', 'templates/bootstrap/src/presentations/index.ts',
      'templates/bootstrap/src/presentation-kit/Presentation.tsx', 'templates/bootstrap/scripts/verify.mjs',
      'templates/bootstrap/scripts/inspect-presentation.mjs', 'templates/presentation/README.md',
      'templates/presentation/entities.ts', 'templates/presentation/steps/step-01.tsx', 'templates/presentation/Talk.tsx',
    ]) await expect(readFile(path.join(root, 'skills/presentation', file), 'utf8')).resolves.toBeTruthy()
    const skillPath = path.join(root, 'skills/presentation/SKILL.md')
    const probe = `import { access } from 'node:fs/promises'; import path from 'node:path'; const skill = ${JSON.stringify(skillPath)}; await access(path.join(path.dirname(skill), 'templates/bootstrap/package.json'))`
    const lookup = spawnSync(process.execPath, ['--input-type=module', '-e', probe], { cwd: os.tmpdir(), encoding: 'utf8' })
    expect(lookup.status).toBe(0)
  })

  it('keeps the root verifier strict when the reference registration is removed', async () => {
    const dir = await temp()
    const sample = path.join(dir, 'src/presentations/how-to-make-a-presentation/steps'), bin = path.join(dir, 'bin')
    await mkdir(sample, { recursive: true }); await mkdir(bin, { recursive: true })
    await writeFile(path.join(dir, 'package.json'), '{}'); await symlink(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
    await writeFile(path.join(dir, 'src/presentations/index.ts'), 'export const presentations = []')
    await writeFile(path.join(bin, 'npm'), '#!/bin/sh\nexit 0\n'); await chmod(path.join(bin, 'npm'), 0o755)
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/verify.mjs')], { cwd: dir, encoding: 'utf8', env: { ...process.env, AND_SCENE_ROOT: dir, PATH: `${bin}:${process.env.PATH}` } })
    expect(result.status).not.toBe(0)
    expect(`${result.stdout}\n${result.stderr}`).toContain('[sample] FAIL: [sample] registry does not register')
  }, 30000)

  it('reports kit and shared-script drift clearly', async () => {
    const dir = await temp(), target = path.join(dir, 'bootstrap')
    await cp(bootstrap, target, { recursive: true })
    await writeFile(path.join(target, 'src/presentation-kit/types.ts'), 'drift')
    const result = invoke(['--check', '--template-root', target])
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('src/presentation-kit/types.ts: content differs')
    await cp(path.join(root, 'scripts/verify.mjs'), path.join(target, 'scripts/verify.mjs'))
    await writeFile(path.join(target, 'scripts/verify.mjs'), 'drift')
    const verifyDrift = invoke(['--check', '--template-root', target])
    expect(verifyDrift.status).not.toBe(0)
    expect(verifyDrift.stderr).toContain('scripts/verify.mjs: content differs')
    await cp(path.join(root, 'scripts/verify-presentation.mjs'), path.join(target, 'scripts/verify-presentation.mjs'))
    await writeFile(path.join(target, 'scripts/verify-presentation.mjs'), 'drift')
    const presentationVerifierDrift = invoke(['--check', '--template-root', target])
    expect(presentationVerifierDrift.status).not.toBe(0)
    expect(presentationVerifierDrift.stderr).toContain('scripts/verify-presentation.mjs: content differs')
  })

  it('refuses to synchronize into an unapproved external directory', async () => {
    const dir = await temp(), target = path.join(dir, 'other-project')
    await cp(bootstrap, target, { recursive: true })
    const before = await readFile(path.join(target, 'src/presentation-kit/types.ts'), 'utf8')
    const result = invoke(['--template-root', target])
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('without --allow-external')
    await expect(readFile(path.join(target, 'src/presentation-kit/types.ts'), 'utf8')).resolves.toBe(before)
  })

  it('materializes a style-neutral app with declared dependencies and runnable scripts', async () => {
    const dir = await temp()
    await cp(bootstrap, dir, { recursive: true })
    const manifest = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(manifest.dependencies[name]).toBeTruthy()
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', '@eslint/js', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright']) expect(manifest.devDependencies[name]).toBeTruthy()
    expect(manifest.scripts).toMatchObject({ build: expect.any(String), lint: expect.any(String), verify: 'node scripts/verify-presentation.mjs', 'verify:smoke': expect.stringContaining('--smoke'), inspect: expect.any(String) })
    const css = await readFile(path.join(dir, 'src/index.css'), 'utf8')
    expect(css).not.toMatch(/#[0-9a-f]{3,8}|\b(font-family|box-shadow|border|background|color)\s*:|--[\w-]+\s*:/i)
    const kitText = (await Promise.all((await readdir(path.join(dir, 'src/presentation-kit'), { recursive: true })).filter((file) => typeof file === 'string').map((file) => readFile(path.join(dir, 'src/presentation-kit', file), 'utf8').catch(() => '')))).join('\n')
    expect(kitText).not.toMatch(/tailwindcss|@tailwindcss\/vite/)
  }, 30000)

  it('installs, builds, lints, and strictly verifies a materialized bootstrap outside the repository', async () => {
    const dir = await temp()
    await cp(bootstrap, dir, { recursive: true })
    const authored = path.join(dir, 'src/presentations/authored')
    await mkdir(path.join(authored, 'steps'), { recursive: true })
    await writeFile(path.join(dir, 'src/presentations/index.ts'), `import type { ComponentType } from 'react'
export type PresentationEntry = { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: PresentationEntry[] = [{ slug: 'authored', title: 'Authored scene', load: () => import('./authored/Talk') }]
export function isValidRegistry(entries: readonly PresentationEntry[]): boolean { return entries.length > 0 && new Set(entries.map(({ slug }) => slug)).size === entries.length }
`)
    await writeFile(path.join(authored, 'Scene.tsx'), `import { Label, SceneLayer } from '../../presentation-kit/nodes'
import type { SceneProps } from '../../presentation-kit/types'
export default function AuthoredScene({ step }: SceneProps) { return <SceneLayer id="authored:layer"><Label id="authored:label">{step.title}</Label></SceneLayer> }
`)
    await writeFile(path.join(authored, 'steps/index.ts'), `import type { Step } from '../../../presentation-kit/types'
import AuthoredScene from '../Scene'
export const STEPS: readonly Step[] = [
  { id: 'start', era: 'Intro', title: 'Start', caption: 'The first beat.', Scene: AuthoredScene, payload: undefined },
  { id: 'middle-a', era: 'Story', title: 'Middle A', caption: 'A continuing scene.', Scene: AuthoredScene, payload: undefined, groupKey: 'story' },
  { id: 'middle-b', era: 'Story', title: 'Middle B', caption: 'The same scene continues.', Scene: AuthoredScene, payload: undefined, groupKey: 'story' },
  { id: 'end', era: 'Outro', title: 'End', caption: 'The final beat.', Scene: AuthoredScene, payload: undefined },
]
`)
    await writeFile(path.join(authored, 'Talk.tsx'), `import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
export default function Talk() { return <Presentation steps={STEPS} title="Authored scene" initialMode="browse" /> }
`)
    const run = async (command: string, args: string[]) => {
      try { await execFileAsync(command, args, { cwd: dir, timeout: 240_000, maxBuffer: 4 * 1024 * 1024 }); }
      catch (error) { const detail = error as { stdout?: string; stderr?: string; message: string }; throw new Error(`${command} ${args.join(' ')} failed\n${detail.stdout || ''}\n${detail.stderr || detail.message}`, { cause: error }) }
    }
    await run('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund'])
    await run('npm', ['run', 'build'])
    await run('npm', ['run', 'lint'])
    await run('npm', ['run', 'verify'])
  }, 360000)
})
