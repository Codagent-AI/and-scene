import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const check = args.includes('--check')
const targetAt = args.indexOf('--template-root')
const templateRoot = targetAt >= 0 ? path.resolve(args[targetAt + 1]) : path.join(root, 'skills/presentation/templates/bootstrap')
const pairs = [
  ['src/presentation-kit', 'src/presentation-kit'],
  ['scripts/inspect-presentation.mjs', 'scripts/inspect-presentation.mjs'],
  ['scripts/inspection-diagnostics.mjs', 'scripts/inspection-diagnostics.mjs'],
  ['scripts/sample-outline.mjs', 'scripts/sample-outline.mjs'],
]
async function files(dir) {
  const result = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...(await files(full)).map((item) => path.join(entry.name, item)))
    else if (entry.isFile()) result.push(entry.name)
  }
  return result.sort()
}
async function equalTree(source, target, label) {
  const sourceFiles = await files(source).catch(() => [])
  const targetFiles = await files(target).catch(() => [])
  if (JSON.stringify(sourceFiles) !== JSON.stringify(targetFiles)) return `${label}: file list differs`
  for (const file of sourceFiles) {
    const [a, b] = await Promise.all([readFile(path.join(source, file)), readFile(path.join(target, file))])
    if (!a.equals(b)) return `${label}/${file}: content differs`
  }
}
let failures = []
for (const [sourceRel, targetRel] of pairs) {
  const source = path.join(root, sourceRel)
  const target = path.join(templateRoot, targetRel)
  if (check) {
    const failure = (await stat(source).catch(() => null))?.isDirectory()
      ? await equalTree(source, target, targetRel)
      : (await readFile(source).catch(() => null))?.equals(await readFile(target).catch(() => Buffer.alloc(0))) ? undefined : `${targetRel}: content differs`
    if (failure) failures.push(failure)
  } else {
    await mkdir(path.dirname(target), { recursive: true })
    await rm(target, { recursive: true, force: true })
    await cp(source, target, { recursive: true })
  }
}
// The bootstrap's verify.mjs adds only an explicit --smoke route mode; strict mode stays source-equivalent in behavior.
const rootVerify = await readFile(path.join(root, 'scripts/verify.mjs'), 'utf8')
const templateVerify = await readFile(path.join(templateRoot, 'scripts/verify.mjs'), 'utf8').catch(() => '')
if (!templateVerify.includes("args.indexOf('--smoke')") || !templateVerify.includes("if (!smokeSlug)")) failures.push('scripts/verify.mjs: missing explicit smoke mode or strict default')
if (!rootVerify.includes('validateSample(root, slug)')) failures.push('scripts/verify.mjs: root strict sample validation contract changed')
if (check && failures.length) {
  console.error(`Template drift detected:\n${failures.map((item) => `- ${item}`).join('\n')}`)
  process.exitCode = 1
} else if (check) console.log('Template sources are in sync (bootstrap verify has explicit smoke mode).')
else console.log('Synchronized canonical kit and shared scripts into bootstrap template.')
