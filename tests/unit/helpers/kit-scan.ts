import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

/** npm scripts and vitest run from the repository root; jsdom gives no file URL for import.meta. */
export const REPO_ROOT = process.cwd()
if (!existsSync(join(REPO_ROOT, 'package.json')) || !existsSync(join(REPO_ROOT, 'src/presentation-kit'))) {
  throw new Error(`tests must run from the repository root, got ${REPO_ROOT}`)
}

/**
 * Kit copies that must stay style-neutral. The bootstrap copy is included
 * automatically once the template directory exists.
 */
export const KIT_DIRS: readonly string[] = [
  'src/presentation-kit',
  'skills/presentation/templates/bootstrap/src/presentation-kit',
].filter((d) => existsSync(join(REPO_ROOT, d)))

const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/
const STYLE_EXT = /\.(css|scss|sass|less|styl)$/
const TEST_FILE = /\.test\.(ts|tsx|js|jsx|mjs|cjs)$/

export interface Finding {
  file: string
  line: number
  category: string
  detail: string
}

/** Recursively lists non-test kit sources (code and stylesheets), absolute paths, sorted. */
export function listKitFiles(dir: string): string[] {
  const out: string[] = []
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const full = join(current, name)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (!TEST_FILE.test(name) && (SOURCE_EXT.test(name) || STYLE_EXT.test(name))) {
        out.push(full)
      }
    }
  }
  walk(dir)
  return out.sort()
}

/** Removes comments while keeping line numbers. `//` must start a token to avoid URLs. */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[\s;,([{])\/\/.*$/gm, '$1')
}

const RULES: ReadonlyArray<{ category: string; pattern: RegExp }> = [
  { category: 'stylesheet-import', pattern: /\b(?:import|require)\b[^;\n]*?['"`][^'"`\n]*\.(?:css|scss|sass|less|styl)(?:\?[^'"`\n]*)?['"`]/ },
  { category: 'css-in-js', pattern: /\bstyled\s*(?:\.\w+|\()|\bcss\s*`|\bkeyframes\s*`/ },
  {
    category: 'styling-framework',
    pattern: /(styled-components|@emotion\b|\bemotion\b|@stitches|styled-jsx|@linaria|@vanilla-extract|tailwind|@mui\/|@chakra-ui|@mantine|@fluentui|\bantd\b)/i,
  },
  {
    // Visual declaration keys: colour, paint, type, edges, radius, outline, effects, spacing.
    category: 'visual-declaration',
    pattern:
      /(?<![\w$-])(color|background[\w-]*|font[\w-]*|border[\w-]*|box-?shadow|text-?shadow|text-?decoration[\w-]*|text-?align|text-?transform|letter-?spacing|line-?height|outline[\w-]*|filter|backdrop-?filter|padding[\w-]*|margin[\w-]*)\s*\??\s*:/i,
  },
  { category: 'custom-property', pattern: /(?<![\w-])--[A-Za-z][\w-]*['"]?\s*:|var\(\s*--|setProperty\(\s*['"`]--/ },
  {
    category: 'color-value',
    pattern: /['"`][^'"`\n]*(#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color-mix)\s*\()/,
  },
  { category: 'svg-paint', pattern: /\b(?:stroke|fill|stop-color|flood-color)\s*=\s*\{?\s*['"](?!currentColor['"]|none['"]|transparent['"])[^'"]*['"]/ },
  { category: 'theme-token', pattern: /\b(theme|palette|design-?tokens?|colorTokens)\b/i },
]

/** Scans (relative path, text) pairs and returns every visual or framework violation. */
export function scanKitSources(files: ReadonlyArray<{ file: string; text: string }>): Finding[] {
  const findings: Finding[] = []
  for (const { file, text } of files) {
    if (STYLE_EXT.test(file)) {
      findings.push({ file, line: 1, category: 'stylesheet', detail: 'kit ships a stylesheet' })
      continue
    }
    const lines = stripComments(text).split('\n')
    lines.forEach((line, i) => {
      for (const { category, pattern } of RULES) {
        const hit = pattern.exec(line)
        if (hit) findings.push({ file, line: i + 1, category, detail: hit[0].trim() })
      }
    })
  }
  return findings
}

/** Scans every non-test kit file under an absolute directory. */
export function scanKitDirectory(dir: string): Finding[] {
  const files = listKitFiles(dir).map((abs) => ({
    file: relative(REPO_ROOT, abs) || abs,
    text: readFileSync(abs, 'utf8'),
  }))
  return scanKitSources(files)
}

export function kitAbsolutePaths(): string[] {
  return KIT_DIRS.map((d) => resolve(REPO_ROOT, d))
}

/** Matches the style-neutral allowlist: geometry, animation transform/opacity and layout placement only. */
export const ALLOWED_INLINE_STYLE = new RegExp(
  '^(position|left|top|right|bottom|inset|width|height|min-width|max-width|min-height|max-height|' +
    'transform|transform-origin|overflow|overflow-x|overflow-y|display|pointer-events|opacity|z-index|' +
    'flex[\\w-]*|grid[\\w-]*|align-[\\w-]+|justify-[\\w-]+|place-[\\w-]+|gap|row-gap|column-gap|order|will-change)$',
)
