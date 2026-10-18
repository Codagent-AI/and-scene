import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const json = (path: string) => JSON.parse(read(path).replace(/\/\*[\s\S]*?\*\//g, ''))

function walk(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(dir, name)
    return statSync(join(root, path)).isDirectory() ? walk(path) : [path]
  })
}

const KIT = 'src/presentation-kit'
const TEMPLATE = 'skills/presentation/templates/bootstrap'
const kitFiles = walk(KIT)

// Inline style keys the kit may set: canvas geometry, flex plumbing, and pointer behavior only.
const GEOMETRY_KEYS = new Set([
  'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'minWidth', 'minHeight', 'display',
  'flex', 'flexDirection', 'alignItems', 'overflow', 'transform', 'transformOrigin', 'pointerEvents',
])

describe('style-neutral kit', () => {
  it('ships no stylesheets and imports no styling framework', () => {
    expect(kitFiles.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f))).toEqual([])
    for (const file of kitFiles) {
      const source = readFileSync(join(root, file), 'utf8')
      expect(source, file).not.toMatch(/from ['"][^'"]*(tailwind|styled-components|@emotion|@mui|bootstrap|clsx)[^'"]*['"]/)
      expect(source, file).not.toMatch(/import ['"][^'"]+\.(css|scss)['"]/)
    }
  })

  it('declares no colors, fonts, borders, shadows, backgrounds, or tokens', () => {
    const visual = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\bvar\(--|\bfont(Family|Size|Weight)?\b|\bboxShadow\b|\bborder\w*\b|\bbackground\w*\b|\bcolor\s*:|\bborderRadius\b|\bgap\b|\bmargin\b|\bpadding\b|\bcursor\b/
    for (const file of kitFiles) {
      const source = readFileSync(join(root, file), 'utf8')
      expect(source.match(visual)?.[0], file).toBeUndefined()
    }
  })

  it('limits inline style objects to geometry and layout plumbing', () => {
    for (const file of kitFiles.filter((f) => f.endsWith('.tsx') || f.endsWith('shared.ts'))) {
      const source = readFileSync(join(root, file), 'utf8')
      const blocks = source.match(/style=\{\{[^}]*\}\}|return \{\s*position: 'absolute'[^}]*\}|return \{ \.\.\.style \}/g) ?? []
      for (const block of blocks) {
        const keys = [...block.matchAll(/(\w+):/g)].map((m) => m[1]).filter((k) => k !== 'style')
        for (const key of keys) expect(GEOMETRY_KEYS.has(key), `${file}: ${key}`).toBe(true)
      }
    }
  })

  it('keeps Tailwind and design tokens out of dependencies, host CSS, and the scaffold', () => {
    for (const pkg of ['package.json', `${TEMPLATE}/package.json`]) {
      const all = { ...json(pkg).dependencies, ...json(pkg).devDependencies }
      expect(Object.keys(all).filter((name) => /tailwind|styled-components|emotion|bootstrap/.test(name)), pkg).toEqual([])
    }
    for (const css of ['src/index.css', `${TEMPLATE}/src/index.css`]) {
      const source = read(css)
      expect(source).not.toMatch(/@tailwind|@import\s+['"]tailwind|--[\w-]+\s*:/)
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|font-family|box-shadow|border(?!-box)|background|\bcolor\s*:/)
    }
    const vite = read(`${TEMPLATE}/vite.config.ts`)
    expect(vite).not.toMatch(/tailwind/i)
    expect(walk(TEMPLATE).filter((f) => f.endsWith('.css')).map((f) => relative(TEMPLATE, f))).toEqual(['src/index.css'])
  })
})

describe('topic-agnostic kit', () => {
  it('does not depend on the sample or any presentation', () => {
    for (const file of kitFiles) {
      const source = readFileSync(join(root, file), 'utf8')
      expect(source, file).not.toMatch(/presentations\/|how-to-make|nine|\b9\b.*steps/)
      const imports = [...source.matchAll(/from '([^']+)'/g)].map((m) => m[1])
      for (const spec of imports) {
        if (spec.startsWith('.')) {
          expect(spec, `${file} import`).not.toMatch(/\.\.\/\.\.\//)
        }
      }
    }
  })
})

describe('template parity', () => {
  it('keeps the bootstrap kit file-for-file identical to the canonical kit', () => {
    const template = walk(`${TEMPLATE}/src/presentation-kit`).map((f) => relative(`${TEMPLATE}/src/presentation-kit`, f)).sort()
    const canonical = kitFiles.map((f) => relative(KIT, f)).sort()
    expect(template).toEqual(canonical)
    for (const file of canonical) {
      expect(read(`${TEMPLATE}/src/presentation-kit/${file}`), file).toBe(read(`${KIT}/${file}`))
    }
  })

  it('keeps shared scripts identical, with no extra or missing files', () => {
    const shared = ['inspect-lib.mjs', 'inspect-presentation.mjs', 'preview.mjs', 'verify-lib.mjs', 'verify-outline.mjs', 'verify.mjs']
    const template = walk(`${TEMPLATE}/scripts`).map((f) => relative(`${TEMPLATE}/scripts`, f)).sort()
    expect(template).toEqual(shared)
    for (const file of shared) expect(read(`${TEMPLATE}/scripts/${file}`), file).toBe(read(`scripts/${file}`))
  })

  it('keeps shared host files identical', () => {
    for (const file of ['src/main.tsx', 'src/Router.tsx', 'src/router.ts', 'src/Landing.tsx', 'src/index.css', 'src/presentations/types.ts', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json']) {
      expect(read(`${TEMPLATE}/${file}`), file).toBe(read(file))
    }
  })
})

describe('bootstrap dependencies', () => {
  const pkg = json(`${TEMPLATE}/package.json`)
  const lock = json(`${TEMPLATE}/package-lock.json`)
  const declared = { ...pkg.dependencies, ...pkg.devDependencies }

  it('declares the complete React, Vite, TypeScript, Motion, Lucide, lint, and Playwright set', () => {
    const required = [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react',
      '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]
    expect(required.filter((name) => !(name in declared))).toEqual([])
  })

  it('commits lock data consistent with the manifest', () => {
    expect(lock.lockfileVersion).toBeGreaterThanOrEqual(3)
    const rootEntry = lock.packages['']
    expect(rootEntry.dependencies).toEqual(pkg.dependencies)
    expect(rootEntry.devDependencies).toEqual(pkg.devDependencies)
    for (const name of Object.keys(declared)) {
      expect(lock.packages[`node_modules/${name}`], name).toBeDefined()
    }
  })

  it('matches the root project versions for shared packages', () => {
    const root = json('package.json')
    const rootAll = { ...root.dependencies, ...root.devDependencies }
    for (const [name, range] of Object.entries(declared)) expect(rootAll[name], name).toBe(range)
  })

  it('exposes the scaffolded scripts and no sample configuration', () => {
    expect(Object.keys(pkg.scripts).sort()).toEqual(['build', 'dev', 'inspect', 'lint', 'preview', 'verify'])
    expect(pkg.andScene).toBeUndefined()
    expect(read(`${TEMPLATE}/src/presentations/index.ts`)).not.toMatch(/how-to-make/)
  })

  it('ships the three anchors: build setup, scene kit, and presentation index', () => {
    for (const file of ['package.json', 'vite.config.ts', 'src/presentation-kit/Presentation.tsx', 'src/presentation-kit/Stage.tsx', 'src/presentations/index.ts', 'src/Router.tsx']) {
      expect(existsSync(join(root, TEMPLATE, file)), file).toBe(true)
    }
  })
})

describe('project gates', () => {
  const pkg = json('package.json')

  it('keeps npm test to fast unit tests and puts browser-backed suites in their own script', () => {
    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:integration']).toContain('vitest.integration.config.ts')
    expect(read('vitest.config.ts')).not.toMatch(/tests\/integration/)
    expect(read('vitest.integration.config.ts')).toMatch(/tests\/integration/)
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })

  it('builds the whole app: tsc -b over src, then the production build', () => {
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(json('tsconfig.app.json').include).toContain('src')
    expect(json('tsconfig.json').references.map((r: { path: string }) => r.path)).toContain('./tsconfig.app.json')
  })

  it('uses 127.0.0.1 for every preview, probe, and browser URL', () => {
    const files = walk('scripts').filter((f) => f.endsWith('.mjs'))
    for (const file of files) expect(read(file), file).not.toMatch(/localhost|\[::1\]|0\.0\.0\.0/)
    expect(read('scripts/preview.mjs')).toContain("export const HOST = '127.0.0.1'")
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(read(file), file).toContain("from './preview.mjs'")
      expect(read(file), file).not.toMatch(/http:\/\/(?!\$\{)/)
    }
  })

  it('resolves the project root from the script location and always cleans up', () => {
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      const source = read(file)
      expect(source).toMatch(/path\.resolve\(path\.dirname\(fileURLToPath\(import\.meta\.url\)\), '\.\.'\)/)
      expect(source).toMatch(/finally \{[\s\S]*preview\.stop\(\)/)
    }
  })

  it('keeps StrictMode and the explicit registry wiring in the app entry', () => {
    expect(read('src/main.tsx')).toContain('StrictMode')
  })
})

describe('repository hygiene', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)

  it('tracks no hosted CI configuration or generated artifacts', () => {
    expect(tracked.filter((f) => /^\.github\/|^\.gitlab-ci|^\.circleci\/|azure-pipelines|Jenkinsfile/.test(f))).toEqual([])
    expect(tracked.filter((f) => /(^|\/)(dist|node_modules|\.inspection)\//.test(f))).toEqual([])
    expect(tracked.filter((f) => f.endsWith('.png'))).toEqual([])
  })

  it('ignores generated locations', () => {
    const ignore = read('.gitignore')
    for (const entry of ['node_modules', 'dist', '.inspection']) expect(ignore).toContain(entry)
    expect(read(`${TEMPLATE}/.gitignore`)).toContain('.inspection')
  })
})
