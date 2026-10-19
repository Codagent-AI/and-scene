import { describe, expect, it } from 'vitest'
import ts from 'typescript'

// Static contract: the kit is style-neutral. Source-level scan over every non-test kit file,
// plus the root package manifest and Vite config. Sources are read through Vite raw globs so
// the test typechecks under the app tsconfig (vite/client types only).

const KIT_SOURCES = import.meta.glob('./**/*', { query: '?raw', import: 'default', eager: true })
const ROOT_MANIFESTS = import.meta.glob(['/package.json', '/vite.config.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Kit files only: relative keys under this directory, excluding tests.
const FILES: Array<{ file: string; text: string }> = Object.entries(KIT_SOURCES)
  .filter(([key]) => !/\.test\.[cm]?[jt]sx?$/.test(key))
  .map(([key, text]) => ({ file: `src/presentation-kit/${key.replace(/^\.\//, '')}`, text }))

// Only runtime packages the kit may import. Anything else (Tailwind, component libraries, CSS-in-JS) is a host choice.
const ALLOWED_PACKAGES = new Set(['react', 'react-dom', 'motion/react', 'lucide-react'])

// Geometry and layout properties permitted in inline style objects.
const GEOMETRY_KEYS = new Set([
  'position', 'inset', 'top', 'left', 'right', 'bottom', 'width', 'height', 'minWidth', 'minHeight',
  'maxWidth', 'maxHeight', 'transform', 'transformOrigin', 'display', 'flex', 'flexDirection', 'flexWrap',
  'alignItems', 'justifyContent', 'gap', 'margin', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom',
  'padding', 'overflow', 'zIndex', 'pointerEvents', 'opacity', 'gridArea', 'gridColumn', 'gridRow',
])

// Visual properties that must never be authored by the kit, even outside style literals.
const FORBIDDEN_VISUAL = /^(color|background\w*|font\w*|border\w*|outline\w*|boxShadow|textShadow|filter|backdropFilter|borderRadius|textDecoration\w*|textTransform|letterSpacing|lineHeight|textAlign|caretColor)$/

function parse(file: string, text: string): ts.SourceFile {
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind)
}

interface Finding {
  file: string
  line: number
  message: string
}

function scan({ file, text }: { file: string; text: string }): Finding[] {
  const isTs = /\.(ts|tsx)$/.test(file)
  if (!isTs) return []
  const sf = parse(file, text)
  const out: Finding[] = []
  const at = (node: ts.Node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
  const add = (node: ts.Node, message: string) => out.push({ file, line: at(node), message })

  const visit = (node: ts.Node) => {
    // Imports: only allowed packages and relative modules.
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const spec = node.moduleSpecifier.text
      if (!spec.startsWith('.') && !ALLOWED_PACKAGES.has(spec)) add(node, `disallowed package import '${spec}'`)
      if (/\.css$/.test(spec)) add(node, `CSS import '${spec}'`)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      add(node, 'dynamic import in kit (style or framework loading is not allowed here)')
    }

    // Object literal property names: forbidden visual keys anywhere (covers style objects built in variables).
    if ((ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) && ts.isIdentifier(node.name)) {
      if (FORBIDDEN_VISUAL.test(node.name.text)) add(node, `visual property '${node.name.text}' authored in kit`)
    }

    // JSX style attributes: literal objects may only carry geometry; string styles are rejected.
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name)) {
      const attr = node.name.text
      if (attr === 'className' && node.initializer && ts.isStringLiteral(node.initializer)) {
        add(node, `hard-coded className '${node.initializer.text}' (kit classes must be consumer-supplied)`)
      }
      if (attr === 'style') {
        const init = node.initializer
        if (init && ts.isStringLiteral(init)) add(node, 'string style attribute')
        const expr = init && ts.isJsxExpression(init) ? init.expression : undefined
        if (expr && ts.isObjectLiteralExpression(expr)) {
          for (const prop of expr.properties) {
            if (ts.isSpreadAssignment(prop)) continue
            const name = prop.name && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) ? prop.name.text : '?'
            if (!GEOMETRY_KEYS.has(name)) add(prop, `non-geometry style key '${name}'`)
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return out
}

describe('kit style neutrality (L-8)', () => {
  it('kit has at least the expected source files', () => {
    expect(FILES.length).toBeGreaterThan(10)
  })

  it('contains no CSS, preprocessor, or theme files', () => {
    const styleFiles = FILES.filter((f) => /\.(css|scss|sass|less)$/.test(f.file))
    expect(styleFiles.map((f) => f.file)).toEqual([])
  })

  it('imports only runtime packages the kit needs (no Tailwind or styling framework)', () => {
    const findings = FILES.flatMap(scan).filter((f) => /import|CSS|dynamic/.test(f.message))
    expect(findings).toEqual([])
  })

  it('authors no visual defaults and only geometry inline styles', () => {
    const findings = FILES.flatMap(scan)
    expect(findings).toEqual([])
  })

  it('root package manifest and Vite config carry no Tailwind or styling framework', () => {
    const pattern = /tailwind|daisyui|bootstrap|@mui|@chakra|chakra-ui|antd|styled-components|@emotion|bulma|mantine/i
    expect(Object.keys(ROOT_MANIFESTS).sort()).toEqual(['/package.json', '/vite.config.ts'])
    for (const [file, text] of Object.entries(ROOT_MANIFESTS)) {
      expect(text, file).not.toMatch(pattern)
    }
  })
})
