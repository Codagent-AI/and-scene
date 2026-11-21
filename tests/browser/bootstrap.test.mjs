import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('../../', import.meta.url))
const locator = join(repo, 'skills/presentation/template-path.mjs')

function run(executable, args, cwd) {
  return execFileSync(executable, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 })
}

function files(directory) {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(directory, join(entry.parentPath, entry.name)))
    .sort()
}

function assertSnapshot(canonical, bundled) {
  const expected = files(canonical)
  assert.deepEqual(files(bundled), expected)
  for (const path of expected) {
    assert.deepEqual(readFileSync(join(bundled, path)), readFileSync(join(canonical, path)), path)
  }
}

test('INT-001 materialized bootstrap builds a reachable style-neutral route', { timeout: 160_000 }, (t) => {
  const temporary = mkdtempSync(join(tmpdir(), 'and-scene-bootstrap-'))
  try {
    const source = run(process.execPath, [locator, 'bootstrap'], temporary).trim()
    const template = run(process.execPath, [locator, 'presentation'], temporary).trim()
    assert.equal(source, join(repo, 'skills/presentation/templates/bootstrap/'))
    assert.equal(template, join(repo, 'skills/presentation/templates/presentation/'))

    const app = join(temporary, 'app')
    cpSync(source, app, { recursive: true })
    assertSnapshot(join(repo, 'src/presentation-kit'), join(app, 'src/presentation-kit'))
    assertSnapshot(join(repo, 'scripts'), join(app, 'scripts'))
    assertSnapshot(template, join(app, 'src/presentations/starter'))

    const manifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react',
      'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js',
      'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright',
    ]) {
      assert.ok(dependencies[name], `missing scaffold dependency ${name}`)
    }
    assert.ok(Object.keys(dependencies).every((name) => !/tailwind/i.test(name)))
    assert.doesNotMatch(readFileSync(join(app, 'vite.config.ts'), 'utf8'), /tailwind/i)
    assert.equal(
      readFileSync(join(app, 'src/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim(),
      '',
    )
    assert.ok(files(join(app, 'src/presentation-kit')).every((path) => !path.endsWith('.css')))

    run('npm', ['ci', '--no-audit', '--no-fund', '--prefer-offline'], app)
    const smoke = run('npm', ['run', 'verify'], app)
    assert.match(smoke, /starter/i)
    assert.match(smoke, /pass/i)
    t.diagnostic(smoke.trim())
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})
