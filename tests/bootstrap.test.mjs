import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cp, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const repository = fileURLToPath(new URL('../', import.meta.url))
// Locate distributable assets from this module, never the caller's cwd.
const bootstrap = fileURLToPath(new URL('../skills/presentation/templates/bootstrap/', import.meta.url))

async function files(directory, relative = '') {
  const result = []
  for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    const name = path.join(relative, entry.name)
    if (entry.isDirectory()) result.push(...await files(directory, name))
    else if (!/\.(test|spec)\./.test(name) && entry.name !== '.DS_Store') result.push(name)
  }
  return result.sort()
}

async function aligned(source, snapshot) {
  const canonicalFiles = await files(source)
  assert.deepEqual(await files(snapshot), canonicalFiles, 'snapshot file inventory matches canonical source')
  for (const name of canonicalFiles) {
    assert.deepEqual(await readFile(path.join(snapshot, name)), await readFile(path.join(source, name)), `${name} is byte-aligned`)
  }
}

function command(cwd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', args, { cwd, env: { ...process.env, NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', data => { output += data })
    child.stderr.on('data', data => { output += data })
    const timer = setTimeout(() => child.kill('SIGTERM'), 240_000)
    child.once('error', error => { clearTimeout(timer); reject(error) })
    child.once('exit', code => {
      clearTimeout(timer)
      console.log(`Materialized bootstrap: npm ${args.join(' ')}\n${output}`)
      if (code === 0) resolve(output)
      else reject(new Error(`npm ${args.join(' ')} exited ${code}\n${output}`))
    })
  })
}

test('INT-001: materialized bootstrap is complete, independent, aligned, and style-neutral', { timeout: 600_000 }, async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'and-scene-bootstrap-'))
  try {
    await cp(bootstrap, temporary, { recursive: true })
    assert.ok(!temporary.startsWith(repository), 'materialization is outside source repository')
    const pkg = JSON.parse(await readFile(path.join(temporary, 'package.json'), 'utf8'))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) {
      assert.ok(pkg.dependencies[name], `runtime dependency ${name}`)
    }
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'playwright', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals']) {
      assert.ok(pkg.devDependencies[name], `build/verification dependency ${name}`)
    }
    assert.ok(pkg.scripts.build && pkg.scripts.verify && pkg.scripts.inspect && pkg.scripts.lint, 'build and verification entry points exist')
    assert.ok(!Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some(name => /tailwind|bootstrap|bulma|material-ui|chakra/.test(name)), 'no required style framework')
    await readFile(path.join(temporary, 'package-lock.json'))
    await readFile(path.join(temporary, 'src/presentations/index.ts'))
    await aligned(path.join(repository, 'src/presentation-kit'), path.join(temporary, 'src/presentation-kit'))
    await aligned(path.join(repository, 'scripts'), path.join(temporary, 'scripts'))
    for (const name of await files(path.join(temporary, 'src/presentation-kit'))) {
      const source = await readFile(path.join(temporary, 'src/presentation-kit', name), 'utf8')
      assert.doesNotMatch(source, /(?:backgroundColor|fontFamily|boxShadow|borderColor|borderRadius|borderStyle|color)\s*:\s*['"`]/, `${name} has no visual defaults`)
      assert.doesNotMatch(source, /@import.*(?:tailwind|theme)|--(?:color|font|spacing)-/, `${name} has no theme/framework defaults`)
    }
    for (const name of (await files(path.join(temporary, 'src'))).filter(name => name.endsWith('.css'))) {
      const css = (await readFile(path.join(temporary, 'src', name), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').trim()
      assert.equal(css, '', `bootstrap CSS ${name} has zero presentation styling defaults`)
    }
    await command(temporary, ['ci', '--no-audit', '--no-fund'])
    const output = await command(temporary, ['run', 'verify', '--', 'example'])
    assert.match(output, /build/i, 'verification builds the materialized app')
    assert.match(output, /PASS/, 'registered example route renders successfully')
    console.log('INT-001 assertions: all anchors/dependencies present; npm ci and production build/render pass; kit and scripts byte-aligned; no scaffold styling defaults; template resolution independent of cwd.')
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
})
