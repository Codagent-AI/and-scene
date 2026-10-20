// Refreshes skills/presentation/templates/bootstrap from the canonical sources
// (the scene kit, sample, host app, and scripts), so the distributable snapshot
// cannot drift from them. Run `npm run sync:template` after changing any of them.
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP = path.join(root, 'skills/presentation/templates/bootstrap')

/** Files copied byte-for-byte; directories are copied without their test files. */
export const SYNCED = [
  '.gitignore', 'index.html', 'eslint.config.js', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
  'vite.config.ts', 'public/favicon.svg', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs',
  'src/main.tsx', 'src/Router.tsx', 'src/Landing.tsx', 'src/routing.ts', 'src/lazyEntry.ts', 'src/index.css',
  'src/presentation-kit', 'src/presentations',
]
const DEV_ONLY = ['vitest', 'jsdom', '@testing-library/react', '@testing-library/dom']
const isTest = (name) => /\.test\.(ts|tsx)$/.test(name) || name === '__fixtures__'

function copyTree(from, to) {
  if (statSync(from).isDirectory()) {
    for (const name of readdirSync(from)) if (!isTest(name)) copyTree(path.join(from, name), path.join(to, name))
  } else {
    mkdirSync(path.dirname(to), { recursive: true })
    cpSync(from, to)
  }
}

export function templatePackageJson(rootPkg) {
  const pkg = structuredClone(rootPkg)
  for (const dep of DEV_ONLY) delete pkg.devDependencies[dep]
  for (const script of ['test', 'test:integration', 'sync:template']) delete pkg.scripts[script]
  return pkg
}

export function sync() {
  rmSync(BOOTSTRAP, { recursive: true, force: true })
  for (const rel of SYNCED) copyTree(path.join(root, rel), path.join(BOOTSTRAP, rel))
  const pkg = templatePackageJson(JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')))
  writeFileSync(path.join(BOOTSTRAP, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
  cpSync(path.join(root, '.npmrc'), path.join(BOOTSTRAP, '.npmrc'))
  const lock = spawnSync('npm', ['install', '--package-lock-only', '--ignore-scripts'], { cwd: BOOTSTRAP, stdio: 'inherit' })
  if (lock.status !== 0 || !existsSync(path.join(BOOTSTRAP, 'package-lock.json'))) {
    throw new Error('could not generate the bootstrap lockfile')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) sync()
