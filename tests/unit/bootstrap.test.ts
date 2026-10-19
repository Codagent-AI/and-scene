import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  applyScaffold, bootstrapDir, ConfirmationRequired, detectAnchors, planScaffold, resolveTarget, skillDir,
} from '../../skills/presentation/scripts/bootstrap.mjs'

const repo = path.resolve('.')
const dirs: string[] = []
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))

const tmp = (prefix = 'boot-') => {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix))
  dirs.push(dir)
  return dir
}
const write = (file: string, content = '') => {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
}
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {}
  const visit = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) visit(full)
      else out[path.relative(dir, full)] = createHash('sha1').update(readFileSync(full)).digest('hex')
    }
  }
  visit(dir)
  return out
}
const scaffolded = () => {
  const dir = tmp()
  applyScaffold(dir)
  return dir
}
const viteBuildPackage = (extra: object = {}) =>
  JSON.stringify({
    name: 'host', private: true, type: 'module',
    scripts: { build: 'tsc -b && vite build', custom: 'echo hi' },
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    devDependencies: { vite: '^8.0.0', typescript: '~6.0.0' },
    ...extra,
  }, null, 2)
function buildOnlyProject(dir: string) {
  write(path.join(dir, 'package.json'), viteBuildPackage())
  write(path.join(dir, 'vite.config.ts'), 'export default {}\n')
  write(path.join(dir, 'tsconfig.json'), '{}\n')
  write(path.join(dir, 'README.md'), 'unrelated\n')
}

describe('template location', () => {
  it('resolves templates from the skill directory, not the working directory', () => {
    expect(skillDir).toBe(path.join(repo, 'skills/presentation'))
    expect(bootstrapDir).toBe(path.join(skillDir, 'templates/bootstrap'))
    const elsewhere = tmp('cwd-')
    const previous = process.cwd()
    process.chdir(elsewhere)
    try {
      const target = tmp()
      const result = applyScaffold(target)
      expect(result.written).toContain('src/presentation-kit/index.ts')
      expect(detectAnchors(target)).toEqual({ build: true, kit: true, index: true })
    } finally {
      process.chdir(previous)
    }
  })

  it('works through the CLI from an unrelated working directory', () => {
    const cwd = tmp('cwd-')
    const target = tmp()
    const cli = path.join(skillDir, 'scripts/bootstrap.mjs')
    const detect = spawnSync(process.execPath, [cli, 'detect', '--dir', target], { cwd, encoding: 'utf8' })
    expect(JSON.parse(detect.stdout).anchors).toEqual({ build: false, kit: false, index: false })
    const apply = spawnSync(process.execPath, [cli, 'apply', '--dir', target, '--no-install'], { cwd, encoding: 'utf8' })
    expect(apply.status).toBe(0)
    expect(existsSync(path.join(target, 'src/presentations/index.ts'))).toBe(true)
  })
})

describe('anchor detection', () => {
  it('finds nothing in an empty directory', () => {
    expect(detectAnchors(tmp())).toEqual({ build: false, kit: false, index: false })
  })

  it('finds all three anchors in a fresh scaffold', () => {
    expect(detectAnchors(scaffolded())).toEqual({ build: true, kit: true, index: true })
  })

  it('is contract-level: renamed files, reformatted code and extra dependencies still count', () => {
    const dir = scaffolded()
    renameSync(path.join(dir, 'src/presentation-kit/Presentation.tsx'), path.join(dir, 'src/presentation-kit/Deck.tsx'))
    writeFileSync(path.join(dir, 'src/presentation-kit/index.ts'), "export * from './Deck'\nexport * from './Stage'\n")
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    pkg.dependencies.lodash = '^4.0.0'
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg))
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not accept incomplete contracts on file presence alone', () => {
    const dir = scaffolded()
    writeFileSync(path.join(dir, 'src/presentation-kit/Presentation.tsx'), 'export const nothing = 1\n')
    writeFileSync(path.join(dir, 'src/presentation-kit/index.ts'), 'export {}\n')
    expect(detectAnchors(dir).kit).toBe(false)

    const fresh = scaffolded()
    writeFileSync(path.join(fresh, 'src/presentations/index.ts'), 'export const presentations = []\n')
    expect(detectAnchors(fresh).index).toBe(false)

    const noBuild = scaffolded()
    const pkg = JSON.parse(readFileSync(path.join(noBuild, 'package.json'), 'utf8'))
    pkg.scripts.build = 'echo nothing'
    writeFileSync(path.join(noBuild, 'package.json'), JSON.stringify(pkg))
    expect(detectAnchors(noBuild).build).toBe(false)
    pkg.scripts.build = 'npm run bundle'
    pkg.scripts.bundle = 'tsc -b && vite build'
    writeFileSync(path.join(noBuild, 'package.json'), JSON.stringify(pkg))
    expect(detectAnchors(noBuild).build).toBe(true) // a delegated build is still a working build
    pkg.scripts.bundle = 'echo nothing'
    writeFileSync(path.join(noBuild, 'package.json'), JSON.stringify(pkg))
    expect(detectAnchors(noBuild).build).toBe(false)
    delete pkg.dependencies.react
    pkg.scripts.build = 'vite build'
    writeFileSync(path.join(noBuild, 'package.json'), JSON.stringify(pkg))
    expect(detectAnchors(noBuild).build).toBe(false)
  })
})

describe('delegated builds', () => {
  it.each([
    ['npm run', { build: 'npm run bundle', bundle: 'tsc -b && vite build' }],
    ['pnpm', { build: 'pnpm bundle', bundle: 'vite build' }],
    ['two hops', { build: 'npm run a', a: 'yarn b', b: 'vite build' }],
  ])('reuses a build that delegates via %s', (_name, scripts) => {
    const dir = tmp()
    write(path.join(dir, 'package.json'), viteBuildPackage({ scripts }))
    write(path.join(dir, 'vite.config.ts'), 'export default {}\n')
    write(path.join(dir, 'tsconfig.json'), '{}\n')
    expect(detectAnchors(dir).build).toBe(true)
    expect(planScaffold(dir).missing).not.toContain('build')
  })

  it('does not loop on self-referential scripts', () => {
    const dir = tmp()
    write(path.join(dir, 'package.json'), viteBuildPackage({ scripts: { build: 'npm run build' } }))
    write(path.join(dir, 'vite.config.ts'), 'export default {}\n')
    write(path.join(dir, 'tsconfig.json'), '{}\n')
    expect(detectAnchors(dir).build).toBe(false)
  })
})

describe('target resolution', () => {
  it('scaffolds an empty directory at its root', () => {
    const dir = tmp()
    expect(resolveTarget(dir)).toMatchObject({ target: dir, kind: 'standalone', projectEmpty: true })
  })

  it('treats a directory containing only .git as empty', () => {
    const dir = tmp()
    mkdirSync(path.join(dir, '.git'))
    expect(resolveTarget(dir).projectEmpty).toBe(true)
  })

  it('keeps a standalone project with a root build at the root', () => {
    const dir = tmp()
    buildOnlyProject(dir)
    expect(resolveTarget(dir)).toMatchObject({ target: dir, kind: 'standalone', projectEmpty: false })
  })

  it.each([
    ['package.json workspaces', (d: string) => write(path.join(d, 'package.json'), viteBuildPackage({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => write(path.join(d, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")],
    ['packages/ layout', (d: string) => mkdirSync(path.join(d, 'packages/a'), { recursive: true })],
    ['apps/ layout', (d: string) => mkdirSync(path.join(d, 'apps/web'), { recursive: true })],
  ])('puts a monorepo (%s) app in presentations/', (_name, setup) => {
    const dir = tmp()
    write(path.join(dir, 'README.md'), 'mono\n')
    setup(dir)
    expect(resolveTarget(dir)).toMatchObject({ target: path.join(dir, 'presentations'), kind: 'monorepo' })
  })

  it('reuses an existing presentation app, including from a subdirectory', () => {
    const app = scaffolded()
    expect(resolveTarget(app)).toMatchObject({ target: app, kind: 'existing-app' })
    expect(resolveTarget(path.join(app, 'src/presentations'))).toMatchObject({ target: app, kind: 'existing-app' })
  })

  it('finds an existing presentations/ app inside a monorepo', () => {
    const mono = tmp()
    write(path.join(mono, 'pnpm-workspace.yaml'), 'packages: []\n')
    applyScaffold(mono, { confirmed: true })
    expect(resolveTarget(mono)).toMatchObject({ target: path.join(mono, 'presentations'), kind: 'existing-app' })
  })

  it('judges anchors in presentations/, not in a monorepo root build', () => {
    const mono = tmp()
    buildOnlyProject(mono)
    mkdirSync(path.join(mono, 'packages/a'), { recursive: true })
    const { target } = resolveTarget(mono)
    expect(target).toBe(path.join(mono, 'presentations'))
    expect(detectAnchors(target).build).toBe(false)
  })
})

describe('scaffolding', () => {
  it('fully scaffolds an empty directory with the whole dependency set and no styling framework', () => {
    const dir = tmp()
    const result = applyScaffold(dir)
    expect(result.skipped).toBe(false)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright',
    ]) {
      expect(deps, name).toHaveProperty(name)
    }
    expect(Object.keys(deps).filter((n) => /tailwind/i.test(n))).toEqual([])
    expect(Object.keys(pkg.scripts)).toEqual(expect.arrayContaining(['build', 'lint', 'verify', 'inspect']))
    expect(existsSync(path.join(dir, 'package-lock.json'))).toBe(true)
    expect(existsSync(path.join(dir, 'scripts/verify.mjs'))).toBe(true)
  })

  it('skips an already scaffolded app without writing anything', () => {
    const dir = scaffolded()
    const before = snapshot(dir)
    const result = applyScaffold(dir, { confirmed: true })
    expect(result).toMatchObject({ skipped: true, written: [] })
    expect(snapshot(dir)).toEqual(before)
  })

  it('scaffolds only the missing anchor and preserves existing bytes', () => {
    const dir = scaffolded()
    rmSync(path.join(dir, 'src/presentation-kit'), { recursive: true })
    writeFileSync(path.join(dir, 'src/presentations/index.ts'), `${readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')}// mine\n`)
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    pkg.scripts.custom = 'echo custom'
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2))
    const before = snapshot(dir)

    const plan = planScaffold(dir)
    expect(plan.missing).toEqual(['kit'])
    expect(plan.copy.every((f: string) => f.startsWith('src/presentation-kit/'))).toBe(true)
    applyScaffold(dir, { confirmed: true })

    const after = snapshot(dir)
    const changed = Object.keys(after).filter((f) => before[f] !== after[f])
    expect(changed.filter((f) => !f.startsWith('src/presentation-kit/'))).toEqual([])
    expect(readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')).toContain('// mine')
    expect(JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts.custom).toBe('echo custom')
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('adds the kit and index to a build-only project without disturbing it', () => {
    const dir = tmp()
    buildOnlyProject(dir)
    const before = snapshot(dir)
    applyScaffold(dir, { confirmed: true })
    const after = snapshot(dir)
    for (const file of ['vite.config.ts', 'tsconfig.json', 'README.md']) expect(after[file]).toBe(before[file])
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.scripts.custom).toBe('echo hi')
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.dependencies.react).toBe('^19.0.0')
    expect(pkg.dependencies.motion).toBeDefined()
    expect(pkg.devDependencies.playwright).toBeDefined()
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect(existsSync(path.join(dir, 'package-lock.json'))).toBe(false)
  })

  it('reports an existing differing file as a conflict instead of overwriting it', () => {
    const dir = tmp()
    buildOnlyProject(dir)
    write(path.join(dir, 'src/main.tsx'), '// host entry\n')
    const plan = planScaffold(dir)
    expect(plan.conflicts).toContain('src/main.tsx')
    applyScaffold(dir, { confirmed: true })
    expect(readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toBe('// host entry\n')
  })
})

describe('confirmation before writing', () => {
  it.each([
    ['build-only project', (d: string) => buildOnlyProject(d)],
    ['monorepo', (d: string) => { write(path.join(d, 'README.md'), 'x'); mkdirSync(path.join(d, 'packages/a'), { recursive: true }) }],
    ['app missing its kit', (d: string) => { applyScaffold(d); rmSync(path.join(d, 'src/presentation-kit'), { recursive: true }) }],
  ])('refuses to write into a non-empty %s without confirmation', (_name, setup) => {
    const dir = tmp()
    setup(dir)
    const before = snapshot(dir)
    expect(() => applyScaffold(dir)).toThrow(ConfirmationRequired)
    expect(snapshot(dir)).toEqual(before)
    expect(existsSync(path.join(dir, 'presentations'))).toBe(false)
  })

  it('writes a monorepo app into presentations/ after confirmation and leaves the root alone', () => {
    const dir = tmp()
    write(path.join(dir, 'README.md'), 'root\n')
    write(path.join(dir, 'package.json'), viteBuildPackage({ workspaces: ['packages/*'] }))
    const before = snapshot(dir)
    const result = applyScaffold(dir, { confirmed: true })
    expect(result.target).toBe(path.join(dir, 'presentations'))
    const after = snapshot(dir)
    for (const file of Object.keys(before)) expect(after[file]).toBe(before[file])
    expect(Object.keys(after).filter((f) => !before[f]).every((f) => f.startsWith('presentations/'))).toBe(true)
    expect(detectAnchors(path.join(dir, 'presentations'))).toEqual({ build: true, kit: true, index: true })
    expect(JSON.parse(readFileSync(path.join(dir, 'presentations/package.json'), 'utf8')).name).toBe('presentations')
  })

  it('exits with a distinct code from the CLI when confirmation is missing', () => {
    const dir = tmp()
    buildOnlyProject(dir)
    const result = spawnSync(process.execPath, [path.join(skillDir, 'scripts/bootstrap.mjs'), 'apply', '--dir', dir, '--no-install'], { encoding: 'utf8' })
    expect(result.status).toBe(2)
    expect(existsSync(path.join(dir, 'src'))).toBe(false)
  })
})
