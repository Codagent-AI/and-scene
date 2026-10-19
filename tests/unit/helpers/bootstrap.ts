import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { scanKitSources, type Finding } from './kit-scan'

/** Scaffold dependency set the bootstrap must declare (design, "Required dependency set"). */
export const REQUIRED_DEPS = [
  'react',
  'react-dom',
  'motion',
  'lucide-react',
  'vite',
  '@vitejs/plugin-react',
  'typescript',
  '@types/react',
  '@types/react-dom',
  '@types/node',
  'eslint',
  '@eslint/js',
  'typescript-eslint',
  'eslint-plugin-react-hooks',
  'eslint-plugin-react-refresh',
  'globals',
  'playwright',
] as const

/** Package names that would impose a styling system on the scaffold. */
export const STYLING_FRAMEWORK_NAME =
  /^(tailwindcss|@tailwindcss\/.+|tailwind[\w.-]*|styled-components|@emotion\/.+|emotion|@stitches\/.+|styled-jsx|@linaria\/.+|@vanilla-extract\/.+|@mui\/.+|@chakra-ui\/.+|@mantine\/.+|@fluentui\/.+|antd|bootstrap|jss|react-jss)$/

/** Source-level mentions of a styling framework (imports, plugin calls, config keys). */
export const STYLING_FRAMEWORK_TEXT = /tailwind|styled-components|@emotion|postcss|@stitches|@vanilla-extract/i

const TEST_FILE = /\.test\.(ts|tsx|js|jsx|mjs|cjs)$/

/** Anchors from the presentation-skill "Self-bootstrapping scaffold" requirement. */
export const ANCHORS = {
  build: ['package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json'],
  kit: [
    'src/presentation-kit/types.ts',
    'src/presentation-kit/Stage.tsx',
    'src/presentation-kit/usePresentationNav.ts',
    'src/presentation-kit/useFitScale.ts',
    'src/presentation-kit/chrome/Toc.tsx',
    'src/presentation-kit/Presentation.tsx',
  ],
  index: ['src/presentations/index.ts', 'src/main.tsx', 'src/router.tsx', 'src/routes.ts'],
} as const

/** Lists the anchor files that are missing, plus the build script and registry checks that fail. */
export function anchorProblems(root: string): string[] {
  const problems: string[] = []
  for (const group of Object.values(ANCHORS)) {
    for (const rel of group) if (!existsSync(join(root, rel))) problems.push(`missing anchor ${rel}`)
  }
  if (problems.length > 0) return problems
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const build: string = pkg.scripts?.build ?? ''
  if (!/tsc -b/.test(build) || !/vite build/.test(build)) problems.push(`build script is not "tsc -b && vite build": ${build}`)
  const registry = readFileSync(join(root, 'src/presentations/index.ts'), 'utf8')
  if (!/slug:\s*['"]starter['"]/.test(registry) || !/load:\s*\(\)\s*=>\s*import\(/.test(registry)) {
    problems.push('src/presentations/index.ts does not register the starter with a lazy loader')
  }
  const main = readFileSync(join(root, 'src/main.tsx'), 'utf8')
  if (!/\bRouter\b/.test(main) || !/\bpresentations\b/.test(main)) problems.push('src/main.tsx does not route through the presentation registry')
  return problems
}

/** Dependency-set problems for a parsed package.json (missing names only). */
export function dependencyProblems(pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }): string[] {
  const all = { ...pkg.dependencies, ...pkg.devDependencies }
  return REQUIRED_DEPS.filter((name) => all[name] === undefined).map((name) => `missing dependency ${name}`)
}

/** Lists every package name from a lock file's `packages` map (nested entries use their last segment). */
export function lockPackageNames(lock: { packages?: Record<string, unknown> }): string[] {
  return Object.keys(lock.packages ?? {})
    .filter((k) => k !== '')
    .map((k) => k.slice(k.lastIndexOf('node_modules/') + 'node_modules/'.length))
}

/** Relative posix paths of kit-shaped files: everything except tests and __fixtures__ directories. */
function kitFiles(dir: string, keepTests: boolean): Map<string, Buffer> {
  const out = new Map<string, Buffer>()
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const full = join(current, name)
      if (statSync(full).isDirectory()) {
        if (name === '__fixtures__' && !keepTests) continue
        walk(full)
      } else if (keepTests || !TEST_FILE.test(name)) {
        out.set(relative(dir, full).split('\\').join('/'), readFileSync(full))
      }
    }
  }
  walk(dir)
  return out
}

/**
 * Compares a canonical kit directory with its copy. Test files and __fixtures__ are excluded
 * from the canonical side; a test file or fixture found in the copy is itself a problem.
 * Returns human-readable problems (empty when aligned).
 */
export function compareKitTrees(canonicalDir: string, copyDir: string): string[] {
  const canonical = kitFiles(canonicalDir, false)
  const copyAll = kitFiles(copyDir, true)
  const problems: string[] = []
  for (const rel of copyAll.keys()) {
    if (TEST_FILE.test(rel) || rel.split('/').includes('__fixtures__')) problems.push(`test or fixture file in copy: ${rel}`)
  }
  const copy = new Map([...copyAll].filter(([rel]) => !TEST_FILE.test(rel) && !rel.split('/').includes('__fixtures__')))
  for (const rel of canonical.keys()) if (!copy.has(rel)) problems.push(`missing in copy: ${rel}`)
  for (const rel of copy.keys()) if (!canonical.has(rel)) problems.push(`extra in copy: ${rel}`)
  for (const [rel, bytes] of canonical) {
    const other = copy.get(rel)
    if (other && !bytes.equals(other)) problems.push(`bytes differ: ${rel}`)
  }
  return problems
}

/** Layout-plumbing declarations allowed in the bootstrap host stylesheet (keeps the scaffold unstyled). */
const PLUMBING: Readonly<Record<string, RegExp>> = {
  margin: /^0$/,
  'box-sizing': /^border-box$/,
  'min-height': /^100%$/,
}

/** Visual or non-plumbing declarations in a host stylesheet. Empty when only layout plumbing is present. */
export function stylesheetProblems(css: string): string[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const problems: string[] = []
  for (const m of text.matchAll(/([a-zA-Z-]+)\s*:\s*([^;{}]+)/g)) {
    const prop = m[1].toLowerCase()
    const value = m[2].trim()
    const allowed = PLUMBING[prop]
    if (!allowed || !allowed.test(value)) problems.push(`${prop}: ${value}`)
  }
  return problems
}

/** Reads .ts/.tsx/.css sources under a directory as scan inputs (relative file names). */
export function readSources(root: string, dir: string): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = []
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const full = join(current, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(ts|tsx|css)$/.test(name) && !TEST_FILE.test(name)) {
        out.push({ file: relative(root, full), text: readFileSync(full, 'utf8') })
      }
    }
  }
  walk(join(root, dir))
  return out
}

/** Neutrality findings for a presentation directory (no visual defaults, no frameworks). */
export function presentationFindings(root: string, dir: string): Finding[] {
  return scanKitSources(readSources(root, dir))
}
