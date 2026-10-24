import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../..')
const templates = path.join(root, 'skills/presentation/templates')
const bootstrap = path.join(templates, 'bootstrap')

function files(dir: string, skip: string[] = ['node_modules', 'dist', 'inspection']): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (skip.includes(name)) return []
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? files(full, skip) : [full]
  })
}
const rel = (dir: string, list: string[]) => list.map((f) => path.relative(dir, f)).sort()
const read = (...parts: string[]) => readFileSync(path.join(root, ...parts), 'utf8')
const json = (...parts: string[]) => JSON.parse(read(...parts))

const kitDirs = [path.join(root, 'src/presentation-kit'), path.join(bootstrap, 'src/presentation-kit')]
const FORBIDDEN_STYLE_KEYS =
  /\b(color|backgroundColor|background|fontFamily|fontSize|fontWeight|fontStyle|lineHeight|border\w*|boxShadow|textShadow|outline\w*|filter|padding\w*|margin\w*|gap|letterSpacing|textTransform|textDecoration|cursor|fill|stroke\w*)\s*:/

describe('style-neutral kit (canonical and template)', () => {
  it.each(kitDirs)('%s has no stylesheets, framework imports, colour literals or visual style properties', (dir) => {
    const list = files(dir)
    expect(list.length).toBeGreaterThan(10)
    for (const file of list) {
      expect(file, 'kit ships no stylesheets').not.toMatch(/\.(css|scss|sass|less|styl)$/)
      const source = readFileSync(file, 'utf8')
      expect(source, file).not.toMatch(/from ['"][^'"]*(tailwind|styled-components|@emotion|clsx|stitches|@vanilla-extract)[^'"]*['"]/)
      expect(source, file).not.toMatch(/\.(css|scss)['"]/)
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(source, file).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch)\(/)
      expect(source, file).not.toMatch(FORBIDDEN_STYLE_KEYS)
      expect(source, file).not.toMatch(/--[a-z][a-z-]*\s*:/) // no CSS custom-property theme tokens
    }
  })

  it('every entity primitive shares its id as the layoutId and exposes the entity hook', () => {
    for (const name of ['Box', 'Label', 'Frame', 'Emphasis', 'SymbolChip', 'Arrow']) {
      const source = read('src/presentation-kit/nodes', `${name}.tsx`)
      expect(source, name).toContain('layoutId={id}')
      expect(source, name).toContain('data-presentation-entity={id}')
      expect(source, name).toContain('data-presentation-node=')
      expect(source, name).toContain('exit={EXIT}')
    }
  })

  it('neither the app nor the bootstrap requires Tailwind or another styling framework', () => {
    for (const manifest of [json('package.json'), JSON.parse(readFileSync(path.join(bootstrap, 'package.json'), 'utf8'))]) {
      const names = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })
      expect(names.filter((n) => /tailwind|styled-components|@emotion|sass|less|stylus/.test(n))).toEqual([])
    }
    for (const config of ['vite.config.ts']) {
      expect(read(config)).not.toMatch(/tailwind/i)
      expect(readFileSync(path.join(bootstrap, config), 'utf8')).not.toMatch(/tailwind/i)
    }
    expect(readFileSync(path.join(bootstrap, 'src/index.css'), 'utf8')).not.toMatch(/color|font|background|border|shadow/i)
  })

  it('the kit is topic-agnostic: it imports nothing from presentations and names no sample entity', () => {
    for (const file of files(kitDirs[0])) {
      const source = readFileSync(file, 'utf8')
      expect(source, file).not.toMatch(/presentations\/|howto|how-to-make/)
    }
  })
})

describe('template parity', () => {
  it('canonical and template kit trees have identical file sets and bytes', () => {
    const [canonical, snapshot] = kitDirs.map((dir) => rel(dir, files(dir)))
    expect(snapshot).toEqual(canonical)
    for (const file of canonical) {
      expect(readFileSync(path.join(bootstrap, 'src/presentation-kit', file)), file).toEqual(readFileSync(path.join(root, 'src/presentation-kit', file)))
    }
  })

  it('verification and inspection scripts (with their helper modules) are identical copies', () => {
    const rootScripts = rel(path.join(root, 'scripts'), files(path.join(root, 'scripts'))).filter((f) => f !== 'sample-outline.json')
    expect(rel(path.join(bootstrap, 'scripts'), files(path.join(bootstrap, 'scripts')))).toEqual(rootScripts)
    for (const file of rootScripts) {
      expect(readFileSync(path.join(bootstrap, 'scripts', file), 'utf8'), file).toBe(read('scripts', file))
    }
  })

  it('the host files the app and bootstrap share are identical', () => {
    for (const file of ['src/main.tsx', 'src/AppRoot.tsx', 'src/router.ts', 'src/Landing.tsx', 'src/index.css', 'index.html', 'vite.config.ts', 'tsconfig.app.json', 'tsconfig.node.json']) {
      expect(readFileSync(path.join(bootstrap, file), 'utf8'), file).toBe(read(file))
    }
  })
})

describe('bootstrap template completeness', () => {
  const manifest = JSON.parse(readFileSync(path.join(bootstrap, 'package.json'), 'utf8'))

  it('declares the full runtime and build dependency set with matching committed lock data', () => {
    const runtime = ['react', 'react-dom', 'motion', 'lucide-react']
    const dev = ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']
    for (const name of runtime) expect(manifest.dependencies, name).toHaveProperty([name])
    for (const name of dev) expect(manifest.devDependencies, name).toHaveProperty([name])
    const lock = JSON.parse(readFileSync(path.join(bootstrap, 'package-lock.json'), 'utf8'))
    for (const name of [...runtime, ...dev]) expect(lock.packages, name).toHaveProperty([`node_modules/${name}`])
    expect(lock.packages[''].dependencies).toEqual(manifest.dependencies)
    expect(lock.packages[''].devDependencies).toEqual(manifest.devDependencies)
    expect(manifest.scripts).toMatchObject({ build: 'tsc -b && vite build', lint: 'eslint .', verify: 'node scripts/verify.mjs', inspect: 'node scripts/inspect-presentation.mjs' })
  })

  it('ships the three anchors, a starter route, verification and a lock file', () => {
    for (const file of [
      'package.json', 'package-lock.json', 'vite.config.ts', 'src/presentation-kit/Presentation.tsx', 'src/presentation-kit/Stage.tsx',
      'src/presentation-kit/types.ts', 'src/presentation-kit/usePresentationNav.ts', 'src/presentation-kit/chrome/Toc.tsx',
      'src/presentations/index.ts', 'src/router.ts', 'src/Landing.tsx', 'src/main.tsx', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs',
      'verify.config.json', 'src/presentations/getting-started/Talk.tsx',
    ]) {
      expect(existsSync(path.join(bootstrap, file)), file).toBe(true)
    }
    expect(readFileSync(path.join(bootstrap, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'getting-started'")
    expect(JSON.parse(readFileSync(path.join(bootstrap, 'verify.config.json'), 'utf8')).required.slug).toBe('getting-started')
  })

  it('scaffold presentation CSS holds no visual declarations', () => {
    for (const file of files(path.join(templates)).filter((f) => f.endsWith('.css') && f.includes(`${path.sep}presentations${path.sep}`))) {
      const css = readFileSync(file, 'utf8').replace(/\/\*[^]*?\*\//g, '')
      expect(css.trim(), file).toBe('')
    }
  })
})
