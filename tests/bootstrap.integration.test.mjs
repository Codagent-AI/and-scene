import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import test from 'node:test'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(repo, 'skills/presentation/templates/bootstrap')

async function filesBelow(directory, prefix = '') {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name)
    if (entry.isDirectory()) result.push(...await filesBelow(path.join(directory, entry.name), relative))
    else result.push(relative)
  }
  return result.sort()
}

test('materialized bootstrap installs, builds, renders its route, and matches the canonical kit', { timeout: 240_000 }, async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'and-scene-bootstrap-'))
  const project = path.join(temporary, 'app')
  try {
    await cp(bootstrap, project, { recursive: true })
    const packageJson = JSON.parse(await readFile(path.join(project, 'package.json'), 'utf8'))
    const runtime = ['react', 'react-dom', 'motion', 'lucide-react']
    const development = ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'globals', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']
    for (const dependency of runtime) assert.ok(packageJson.dependencies[dependency], `missing runtime dependency ${dependency}`)
    for (const dependency of development) assert.ok(packageJson.devDependencies[dependency], `missing development dependency ${dependency}`)
    assert.ok(!Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies }).some((name) => name.includes('tailwind')))

    execFileSync('npm', ['ci'], { cwd: project, stdio: 'inherit', timeout: 180_000 })
    execFileSync('npm', ['run', 'lint'], { cwd: project, stdio: 'inherit', timeout: 30_000 })
    execFileSync('npm', ['run', 'verify', '--', 'starter'], { cwd: project, stdio: 'inherit', timeout: 90_000, env: { ...process.env, PRESENTATION_PREVIEW_PORT: '4188' } })
    const canonical = path.join(repo, 'src/presentation-kit')
    const copied = path.join(project, 'src/presentation-kit')
    const canonicalFiles = (await filesBelow(canonical)).filter((file) => !file.endsWith('.test.tsx'))
    assert.deepEqual((await filesBelow(copied)), canonicalFiles)
    for (const file of canonicalFiles) {
      assert.equal(await readFile(path.join(copied, file), 'utf8'), await readFile(path.join(canonical, file), 'utf8'), `template kit drift in ${file}`)
    }
    assert.match(await readFile(path.join(project, 'src/index.css'), 'utf8'), /\.presentation--browse/)
    assert.doesNotMatch(await readFile(path.join(project, 'src/index.css'), 'utf8'), /#[0-9a-f]{3,8}|font-family|--[\w-]+\s*:/i)
    assert.match(await readFile(path.join(bootstrap, 'scripts/verify.mjs'), 'utf8'), /127\.0\.0\.1/)
    assert.match(await readFile(path.join(bootstrap, 'scripts/inspect-presentation.mjs'), 'utf8'), /127\.0\.0\.1/)
    assert.match(await readFile(path.join(repo, 'skills/presentation/SKILL.md'), 'utf8'), /relative to this skill file/i)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
})
