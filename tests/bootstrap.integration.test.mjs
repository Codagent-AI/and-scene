import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const exec = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function files(directory, prefix = '') {
  const result = []
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const relative = join(prefix, entry.name)
    if (entry.isDirectory()) result.push(...await files(directory, relative))
    else if (!/\.(test|spec)\./.test(entry.name)) result.push(relative)
  }
  return result.sort()
}

async function run(command, args, cwd) {
  const result = await exec(command, args, { cwd, timeout: 180000, maxBuffer: 5 * 1024 * 1024 })
  console.log(result.stdout)
  if (result.stderr) console.log(result.stderr)
  return result.stdout
}

test('INT-001: materialized bootstrap builds and renders from outside the repository with complete neutral contracts', { timeout: 420000 }, async () => {
  const target = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  try {
    // Invoke the public materializer with an unrelated caller directory.
    await run(process.execPath, [join(root, 'skills/presentation/materialize-bootstrap.mjs'), target], tmpdir())
    const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) {
      assert.ok(dependencies[dependency], `required dependency ${dependency}`)
    }
    assert.ok(manifest.scripts.build)
    assert.ok(manifest.scripts.verify)
    assert.ok(manifest.scripts.inspect)
    assert.ok(!Object.keys(dependencies).some(name => /tailwind/i.test(name)))
    await readFile(join(target, 'src/presentations/index.ts'))
    const canonical = join(root, 'src/presentation-kit')
    const copied = join(target, 'src/presentation-kit')
    const canonicalFiles = await files(canonical)
    assert.deepEqual(await files(copied), canonicalFiles)
    for (const relative of canonicalFiles) {
      assert.equal(await readFile(join(copied, relative), 'utf8'), await readFile(join(canonical, relative), 'utf8'), `kit parity: ${relative}`)
    }
    for (const name of ['verify.mjs', 'inspect-presentation.mjs', 'browser-session.mjs', 'diagnostics.mjs', 'reference.mjs']) {
      assert.equal(await readFile(join(target, 'scripts', name), 'utf8'), await readFile(join(root, 'scripts', name), 'utf8'), `script parity: ${name}`)
    }
    // Bootstrap CSS may contain comments but no authored presentation style rules.
    for (const relative of (await files(join(target, 'src'))).filter(name => name.endsWith('.css'))) {
      const css = (await readFile(join(target, 'src', relative), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').trim()
      assert.equal(css, '', `bootstrap CSS stays style-neutral: ${relative}`)
    }
    await run('npm', ['ci', '--no-audit', '--no-fund'], target)
    // Local verification performs its own whole-app build and production route smoke check.
    const output = await run('npm', ['run', 'verify', '--', '--slug', 'bootstrap-example'], target)
    assert.match(output, /pass/i)
  } finally {
    await rm(target, { recursive: true, force: true })
  }
})
