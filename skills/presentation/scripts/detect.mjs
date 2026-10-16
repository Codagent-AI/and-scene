// Detects the three scaffold anchors (build setup, scene kit, presentation index)
// and resolves where a presentation app belongs.
//
// usage: node detect.mjs [dir]   -> prints JSON
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const exists = (...p) => fs.existsSync(path.join(...p))
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

/** Contract-level anchor detection: file naming and formatting are free to differ. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const hasViteConfig = fs.existsSync(dir) && fs.readdirSync(dir).some((f) => /^vite\.config\./.test(f))
  const build = Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript && hasViteConfig)

  const kitIndex = ['index.ts', 'index.tsx'].map((f) => path.join(dir, 'src', 'presentation-kit', f)).find((f) => fs.existsSync(f))
  const kit = Boolean(kitIndex && /\bPresentation\b/.test(fs.readFileSync(kitIndex, 'utf8')))

  const index = ['index.ts', 'index.tsx'].some((f) => exists(dir, 'src', 'presentations', f))
  return { build, kit, index }
}

const isEmptyDir = (dir) => !fs.existsSync(dir) || fs.readdirSync(dir).filter((f) => f !== '.git').length === 0

export function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  return Boolean(pkg?.workspaces) || exists(dir, 'pnpm-workspace.yaml') || exists(dir, 'packages') || exists(dir, 'apps')
}

const complete = (a) => a.build && a.kit && a.index
const some = (a) => a.build || a.kit || a.index

export function resolveTarget(dir) {
  const root = detectAnchors(dir)
  const nested = path.join(dir, 'presentations')
  const nestedAnchors = detectAnchors(nested)
  let target = dir
  let reason = 'standalone or empty project: scaffold at the root'
  if (some(root) && !isMonorepo(dir)) reason = 'already inside a presentation app: use it'
  else if (complete(root)) reason = 'already inside a presentation app: use it'
  else if (some(nestedAnchors)) {
    target = nested
    reason = 'existing presentations/ app: use it'
  } else if (isMonorepo(dir)) {
    target = nested
    reason = 'monorepo: scaffold a self-contained app under presentations/'
  }
  const anchors = target === dir ? root : nestedAnchors
  const missing = Object.keys(anchors).filter((k) => !anchors[k])
  return {
    dir,
    target,
    reason,
    anchors,
    missing,
    empty: isEmptyDir(dir),
    // A non-empty project without the kit or index must have its target confirmed before writing.
    needsConfirmation: !isEmptyDir(dir) && (!anchors.kit || !anchors.index),
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(resolveTarget(path.resolve(process.argv[2] ?? process.cwd())), null, 2))
}
