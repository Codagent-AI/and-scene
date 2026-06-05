/** Contract-anchor detection and scaffold target resolution for the presentation skill. */

export interface ProjectSnapshot {
  files: string[]
  packageJson?: {
    scripts?: Record<string, string>
    workspaces?: string[] | Record<string, string[]>
  }
  presentationIndexContent?: string
}

export interface ContractAnchors {
  buildSetup: boolean
  sceneKit: boolean
  presentationIndex: boolean
}

export const REQUIRED_DEPENDENCIES = {
  runtime: ['react', 'react-dom', 'motion', 'lucide-react'] as const,
  dev: [
    'vite',
    '@vitejs/plugin-react',
    'typescript',
    '@types/react',
    '@types/react-dom',
    '@types/node',
    'tailwindcss',
    '@tailwindcss/vite',
    '@eslint/js',
    'eslint',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
    'globals',
    'typescript-eslint',
    'playwright',
  ] as const,
}

const SCENE_KIT_MARKERS = [
  'src/presentation-kit/types.ts',
  'src/presentation-kit/Presentation.tsx',
  'src/presentation-kit/Stage.tsx',
]

const PRESENTATION_INDEX_MARKERS = ['src/presentations/index.ts']

function hasFile(files: string[], path: string): boolean {
  return files.some((f) => f === path || f.endsWith(`/${path}`))
}

function hasPathPrefix(files: string[], prefix: string): boolean {
  return files.some((f) => f.startsWith(prefix))
}

/** Detect the three contract anchors at the presence level (not byte-identical). */
export function detectAnchors(snapshot: ProjectSnapshot): ContractAnchors {
  const { files, packageJson, presentationIndexContent } = snapshot

  const buildSetup =
    hasFile(files, 'vite.config.ts') &&
    hasFile(files, 'package.json') &&
    typeof packageJson?.scripts?.build === 'string'

  const sceneKit = SCENE_KIT_MARKERS.every((m) => hasFile(files, m))

  const presentationIndex =
    PRESENTATION_INDEX_MARKERS.some((m) => hasFile(files, m)) &&
    (presentationIndexContent?.includes('presentations') ?? true)

  return { buildSetup, sceneKit, presentationIndex }
}

/** Heuristic monorepo detection: workspaces, pnpm-workspace.yaml, or packages/apps layout. */
export function isMonorepo(snapshot: ProjectSnapshot): boolean {
  const { files, packageJson } = snapshot
  if (packageJson?.workspaces) return true
  if (hasFile(files, 'pnpm-workspace.yaml')) return true
  if (hasPathPrefix(files, 'packages/')) return true
  if (hasPathPrefix(files, 'apps/')) return true
  return false
}

/** Resolve where to scaffold: repo root for standalone, `presentations/` for monorepos. */
export function resolveScaffoldTarget({ isMonorepo: monorepo }: { isMonorepo: boolean }): string {
  return monorepo ? 'presentations' : '.'
}

/** Derive a URL slug from a presentation title. */
export function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
