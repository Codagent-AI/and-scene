import {
  cp,
  mkdir,
  readFile,
  readdir,
  writeFile,
  access,
} from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const skillDirectory = dirname(fileURLToPath(import.meta.url))
export const bootstrapDirectory = join(skillDirectory, 'templates/bootstrap')
const exists = async (path) => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
export function chooseTarget({ root, anchors, monorepo }) {
  return anchors.kit || anchors.index || !monorepo
    ? root
    : join(root, 'presentations')
}
export function missingAnchors(anchors) {
  return ['build', 'kit', 'index'].filter((anchor) => !anchors[anchor])
}
export function needsConfirmation(nonEmpty, anchors) {
  return nonEmpty && (!anchors.kit || !anchors.index)
}
export async function detect(root) {
  let pkg = {}
  try {
    pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  } catch {
    /* no package yet */
  }
  return {
    anchors: {
      build: Boolean(
        pkg.scripts?.build &&
        (pkg.dependencies?.react || pkg.devDependencies?.react) &&
        (await exists(join(root, 'vite.config.ts'))),
      ),
      kit: await exists(join(root, 'src/presentation-kit/Presentation.tsx')),
      index: await exists(join(root, 'src/presentations/index.ts')),
    },
    monorepo: Boolean(
      pkg.workspaces ||
      (await exists(join(root, 'pnpm-workspace.yaml'))) ||
      (await exists(join(root, 'packages'))) ||
      (await exists(join(root, 'apps'))),
    ),
    nonEmpty: (await readdir(root)).some((name) => name !== '.git'),
  }
}
async function copyMissing(source, target) {
  await mkdir(target, { recursive: true })
  for (const item of await readdir(source, { withFileTypes: true })) {
    const from = join(source, item.name)
    const to = join(target, item.name)
    if (item.isDirectory()) await copyMissing(from, to)
    else if (!(await exists(to))) await cp(from, to)
  }
}
export async function scaffold(
  root,
  { confirmed = false, anchors: declared } = {},
) {
  root = resolve(root)
  await mkdir(root, { recursive: true })
  const detected = await detect(root)
  const anchors = declared ?? detected.anchors
  const target = chooseTarget({ root, anchors, monorepo: detected.monorepo })
  console.log(`Scaffold target: ${target}`)
  if (needsConfirmation(detected.nonEmpty, anchors) && !confirmed)
    throw new Error(
      'Confirm the stated scaffold target before writing (--confirmed)',
    )
  const effective =
    target === root
      ? anchors
      : (await exists(target))
        ? (await detect(target)).anchors
        : { build: false, kit: false, index: false }
  const missing = missingAnchors(effective)
  if (!missing.length) return { target, missing }
  await mkdir(target, { recursive: true })
  if (missing.includes('build')) {
    for (const file of [
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
      'eslint.config.js',
      '.gitignore',
    ]) {
      if (!(await exists(join(target, file))))
        await cp(join(bootstrapDirectory, file), join(target, file))
    }
    await copyMissing(
      join(bootstrapDirectory, 'src/host'),
      join(target, 'src/host'),
    )
    if (!(await exists(join(target, 'src/main.tsx'))))
      await cp(
        join(bootstrapDirectory, 'src/main.tsx'),
        join(target, 'src/main.tsx'),
      )
  }
  if (missing.includes('kit'))
    await copyMissing(
      join(bootstrapDirectory, 'src/presentation-kit'),
      join(target, 'src/presentation-kit'),
    )
  if (missing.includes('index')) {
    await copyMissing(
      join(bootstrapDirectory, 'src/presentations'),
      join(target, 'src/presentations'),
    )
    await copyMissing(
      join(bootstrapDirectory, 'src/host'),
      join(target, 'src/host'),
    )
  }
  await copyMissing(
    join(bootstrapDirectory, 'scripts'),
    join(target, 'scripts'),
  )
  const standard = JSON.parse(
    await readFile(join(bootstrapDirectory, 'package.json'), 'utf8'),
  )
  const packageFile = join(target, 'package.json')
  const existing = (await exists(packageFile))
    ? JSON.parse(await readFile(packageFile, 'utf8'))
    : {}
  const merged = {
    ...standard,
    ...existing,
    scripts: { ...standard.scripts, ...existing.scripts },
    dependencies: { ...standard.dependencies, ...existing.dependencies },
    devDependencies: {
      ...standard.devDependencies,
      ...existing.devDependencies,
    },
  }
  await writeFile(packageFile, JSON.stringify(merged, null, 2) + '\n')
  if (!Object.keys(existing).length)
    await cp(
      join(bootstrapDirectory, 'package-lock.json'),
      join(target, 'package-lock.json'),
    )
  return { target, missing }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const anchorsArg = process.argv.find((arg) => arg.startsWith('--anchors='))
  const anchors = anchorsArg
    ? Object.fromEntries(
        ['build', 'kit', 'index'].map((key) => [
          key,
          anchorsArg.slice(10).split(',').includes(key),
        ]),
      )
    : undefined
  scaffold(process.argv[2] ?? '.', {
    confirmed: process.argv.includes('--confirmed'),
    anchors,
  })
    .then(({ target, missing }) =>
      console.log(
        `Missing anchors installed: ${missing.join(', ') || 'none'}. In ${target}, install dependencies and integrate the host route before building.`,
      ),
    )
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
}
