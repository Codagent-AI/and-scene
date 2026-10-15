import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const check = args.includes('--check')
const allowExternal = args.includes('--allow-external')
const targetAt = args.indexOf('--template-root')
if (targetAt >= 0 && !args[targetAt + 1]) throw new Error('--template-root requires a directory')
const templateRoot = targetAt >= 0 ? path.resolve(args[targetAt + 1]) : path.join(root, 'skills/presentation/templates/bootstrap')
const pairs = [
  ['src/presentation-kit', 'src/presentation-kit'],
  ['scripts/verify.mjs', 'scripts/verify.mjs'],
  ['scripts/inspect-presentation.mjs', 'scripts/inspect-presentation.mjs'],
  ['scripts/inspection-diagnostics.mjs', 'scripts/inspection-diagnostics.mjs'],
  ['scripts/sample-outline.mjs', 'scripts/sample-outline.mjs'],
]
async function listFiles(dir) {
  const result = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...(await listFiles(full)).map((item) => path.join(entry.name, item)))
    else if (entry.isFile()) result.push(entry.name)
  }
  return result.sort()
}
async function comparePair(source, target, sourceRel, targetRel) {
  const sourceInfo = await stat(source).catch(() => null)
  if (!sourceInfo) return `${sourceRel}: canonical source missing`
  if (sourceInfo.isDirectory()) {
    const targetInfo = await stat(target).catch(() => null)
    if (!targetInfo?.isDirectory()) return `${targetRel}: missing from bootstrap`
    const [sourceFiles, targetFiles] = await Promise.all([listFiles(source), listFiles(target)])
    const targetFileSet = new Set(targetFiles)
    const sourceFileSet = new Set(sourceFiles)
    const missing = sourceFiles.find((file) => !targetFileSet.has(file))
    if (missing) return `${targetRel}/${missing}: missing from bootstrap`
    const extra = targetFiles.find((file) => !sourceFileSet.has(file))
    if (extra) return `${targetRel}/${extra}: unexpected template file`
    for (const file of sourceFiles) {
      const [a, b] = await Promise.all([readFile(path.join(source, file)), readFile(path.join(target, file))])
      if (!a.equals(b)) return `${targetRel}/${file}: content differs`
    }
    return undefined
  }
  const [a, b] = await Promise.all([readFile(source), readFile(target).catch(() => null)])
  if (b === null) return `${targetRel}: missing from bootstrap`
  return a.equals(b) ? undefined : `${targetRel}: content differs`
}
async function ensureWritableTarget() {
  const [realRoot, realTarget, bootstrap] = await Promise.all([
    realpath(root), realpath(templateRoot), realpath(path.join(root, 'skills/presentation/templates/bootstrap')),
  ])
  const relative = path.relative(realRoot, realTarget)
  const insideRepository = relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
  if (!insideRepository && !allowExternal) throw new Error('Refusing to sync outside the repository without --allow-external')
  if (insideRepository && realTarget !== bootstrap) throw new Error(`Refusing to sync to ${realTarget}; use the canonical bootstrap directory or pass --allow-external`)
  const manifest = await readFile(path.join(templateRoot, 'package.json'), 'utf8').then(JSON.parse).catch(() => null)
  if (manifest?.name !== 'presentation-app') throw new Error(`Refusing to sync: ${templateRoot} is not a presentation-app bootstrap (package.json name must be "presentation-app")`)
}
async function syncPair(source, target) {
  await mkdir(path.dirname(target), { recursive: true })
  await cp(source, target, { recursive: true, force: true })
}
const failures = []
if (check) {
  for (const [sourceRel, targetRel] of pairs) {
    const issue = await comparePair(path.join(root, sourceRel), path.join(templateRoot, targetRel), sourceRel, targetRel)
    if (issue) failures.push(issue)
  }
  if (failures.length) {
    console.error(`Template drift detected:\n${failures.map((item) => `- ${item}`).join('\n')}`)
    process.exitCode = 1
  } else console.log('Template kit and shared scripts are byte-aligned.')
} else {
  await ensureWritableTarget()
  for (const [sourceRel] of pairs) {
    if (!(await stat(path.join(root, sourceRel)).catch(() => null))) throw new Error(`${sourceRel}: canonical source missing`)
  }
  const stagingRoot = await mkdtemp(path.join(templateRoot, '.sync-stage-'))
  const backups = []
  try {
    for (const [sourceRel, targetRel] of pairs) await syncPair(path.join(root, sourceRel), path.join(stagingRoot, targetRel))
    for (const [, targetRel] of pairs) {
      const target = path.join(templateRoot, targetRel)
      const staged = path.join(stagingRoot, targetRel)
      const backup = path.join(stagingRoot, '.backups', targetRel)
      await mkdir(path.dirname(backup), { recursive: true })
      const existing = await stat(target).catch(() => null)
      if (existing) await rename(target, backup)
      try { await rename(staged, target); backups.push({ target, backup, hadTarget: Boolean(existing) }) }
      catch (error) { if (existing) await rename(backup, target); throw error }
    }
    await Promise.all(backups.filter((entry) => entry.hadTarget).map((entry) => rm(entry.backup, { recursive: true, force: true })))
    console.log('Synchronized canonical kit and shared scripts into bootstrap template.')
  } catch (error) {
    for (const { target, backup, hadTarget } of backups.reverse()) {
      await rm(target, { recursive: true, force: true }).catch(() => {})
      if (hadTarget) await rename(backup, target).catch(() => {})
    }
    throw error
  } finally {
    await rm(stagingRoot, { recursive: true, force: true })
  }
}
