// Bootstrap integration gate: materialize this template away from its source,
// then prove its dependency contract, build, route render, and kit parity.
import { access, cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const here = fileURLToPath(new URL('..', import.meta.url))
const root = fileURLToPath(new URL('../../../../..', import.meta.url))
  const canonicalKit = join(root, 'src/presentation-kit')
const target = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
const run = (cmd, args, cwd) => {
  const result = spawnSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (${result.status})`)
}
async function files(dir) {
  const result = []
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name)
    if (item.isDirectory()) result.push(...(await files(path)))
    else if (!item.name.endsWith('.test.tsx')) result.push(path)
  }
  return result
}
try {
  await cp(here, target, { recursive: true })
  const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  const required = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']
  const declared = { ...manifest.dependencies, ...manifest.devDependencies }
  for (const dep of required) if (!declared[dep]) throw new Error(`Bootstrap dependency contract missing ${dep}`)
  if (Object.keys(declared).some((name) => /tailwind/i.test(name))) throw new Error('Bootstrap must not depend on Tailwind')
  const kit = join(target, 'src/presentation-kit')
  const templateFiles = (await files(kit)).map((file) => relative(kit, file)).sort()
  try {
    await access(canonicalKit)
    const canonicalFiles = (await files(canonicalKit)).map((file) => relative(canonicalKit, file)).sort()
    if (templateFiles.join('\n') !== canonicalFiles.join('\n')) throw new Error('Bootstrap scene-kit files differ from the canonical kit')
    for (const path of templateFiles) {
      if (await readFile(join(kit, path), 'utf8') !== await readFile(join(canonicalKit, path), 'utf8')) throw new Error(`Bootstrap scene-kit drift: ${path}`)
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  for (const anchor of ['vite.config.ts', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts']) {
    if (!(await readFile(join(target, anchor), 'utf8')).length) throw new Error(`Missing scaffold anchor ${anchor}`)
  }
  const kitText = (await Promise.all(templateFiles.map((path) => readFile(join(kit, path), 'utf8')))).join('\n')
  if (/#[\da-f]{3,8}\b|font-family|box-shadow|border-radius|--[\w-]*color|tailwind/i.test(kitText)) throw new Error('Reusable kit contains a presentation styling default')
  // Invoke from outside both the materialized app and source repository.
  run('npm', ['ci'], target)
  run('npm', ['run', 'lint'], target)
  run('npm', ['run', 'build'], target)
  run('npm', ['run', 'verify'], target)
  console.log('PASS: materialized bootstrap is complete, style-neutral, buildable, and route-renderable')
} finally {
  await rm(target, { recursive: true, force: true })
}
