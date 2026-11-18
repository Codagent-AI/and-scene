import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scaffold = join(repository, 'skills/presentation/scripts/scaffold.mjs')
const bootstrap = join(repository, 'skills/presentation/templates/bootstrap')
function run(command, args, cwd) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.on('error', reject)
    child.on('close', code => {
      console.log(`${command} ${args.join(' ')}\n${output}`)
      if (code === 0) resolveResult(output)
      else reject(new Error(`Command exited ${code}: ${output}`))
    })
  })
}
async function files(directory, prefix = '') {
  const result = []
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const relative = join(prefix, item.name)
    if (item.isDirectory()) result.push(...await files(join(directory, item.name), relative))
    else result.push(relative)
  }
  return result.sort()
}

test('INT-001 materialized bootstrap builds and verifies independently with byte-aligned neutral kit', { timeout: 240000 }, async () => {
  const target = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  try {
    const output = await run(process.execPath, [scaffold, target, '--apply'], tmpdir())
    assert.match(output, /"missing"/)
    const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) assert.ok(pkg.dependencies[dependency], dependency)
    for (const dependency of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) assert.ok(pkg.devDependencies[dependency], dependency)
    assert.ok(!Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some(name => /tailwind/i.test(name)))
    const kit = join(repository, 'src/presentation-kit')
    const kitFiles = (await files(kit)).filter(name => !/\.test\./.test(name))
    assert.ok(kitFiles.length > 0)
    assert.deepEqual(await files(join(target, 'src/presentation-kit')), kitFiles)
    for (const file of kitFiles) {
      const canonical = await readFile(join(kit, file), 'utf8')
      assert.equal(await readFile(join(target, 'src/presentation-kit', file), 'utf8'), canonical, file)
      assert.doesNotMatch(canonical, /(?:color|backgroundColor|fontFamily|fontSize|border|boxShadow)\s*:/, `kit visual default in ${file}`)
    }
    for (const file of await files(join(repository, 'scripts'))) {
      if (file.endsWith('.mjs')) assert.equal(await readFile(join(bootstrap, 'scripts', file), 'utf8'), await readFile(join(repository, 'scripts', file), 'utf8'), `script snapshot ${file}`)
    }
    assert.match(await readFile(join(target, 'src/presentations/index.ts'), 'utf8'), /example/)
    assert.doesNotMatch(await readFile(join(target, 'src/main.tsx'), 'utf8'), /\.css['"]|tailwind/i)
    await run('npm', ['ci', '--no-audit', '--no-fund'], target)
    const verified = await run('npm', ['run', 'verify'], target)
    assert.match(verified, /PASS/)
    assert.match(verified, /127\.0\.0\.1/)
  } finally {
    await rm(target, { recursive: true, force: true })
  }
})
