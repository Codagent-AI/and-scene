import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const skillRoot = path.join(repo, 'skills/presentation')
const bootstrap = path.join(skillRoot, 'templates/bootstrap')

function command(program, args, cwd, timeout = 180_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    const timer = setTimeout(() => child.kill('SIGKILL'), timeout)
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.once('error', error => { clearTimeout(timer); reject(error) })
    child.once('exit', (code, signal) => {
      clearTimeout(timer)
      if (code === 0) resolve(output)
      else reject(new Error(`${program} ${args.join(' ')} failed (${signal ?? code}):\n${output}`))
    })
  })
}

async function filesUnder(directory, prefix = '') {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name)
    if (entry.isDirectory()) files.push(...await filesUnder(path.join(directory, entry.name), relative))
    else files.push(relative)
  }
  return files.sort()
}

test('bootstrap materializes, builds, renders, and matches the canonical kit', { timeout: 300_000 }, async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
  const materialized = path.join(temporaryRoot, 'app')
  try {
    await cp(bootstrap, materialized, { recursive: true })
    await command('npm', ['ci', '--ignore-scripts'], materialized)
    await command('npm', ['run', 'lint'], materialized)
    await mkdir(path.join(materialized, 'src/presentations/bootstrap-check'), { recursive: true })
    await writeFile(path.join(materialized, 'src/presentations/bootstrap-check/Talk.tsx'), `
      import { Presentation } from '../../presentation-kit'
      const steps = [{ id: 'check', era: 'Check', title: 'Bootstrap route', caption: 'Render smoke fixture.', Scene: () => <div>Rendered fixture</div>, payload: undefined }]
      export default function Check() { return <Presentation steps={steps} title="Bootstrap check" /> }
    `)
    await writeFile(path.join(materialized, 'src/presentations/index.ts'), `
      export interface PresentationRegistration { slug: string; title: string; load: () => Promise<{ default: import('react').ComponentType }> }
      export const presentations: PresentationRegistration[] = [{ slug: 'bootstrap-check', title: 'Bootstrap check', load: () => import('./bootstrap-check/Talk') }]
    `)
    await command('npm', ['run', 'build'], materialized)
    const output = await command('npm', ['run', 'verify', '--', 'bootstrap-check'], materialized)
    assert.match(output, /PASS: build and browser render check/)

    const canonicalFiles = await filesUnder(path.join(repo, 'src/presentation-kit'))
    const templateFiles = await filesUnder(path.join(materialized, 'src/presentation-kit'))
    assert.deepEqual(templateFiles, canonicalFiles, 'bootstrap scene-kit file set matches canonical kit')
    for (const file of canonicalFiles) {
      assert.equal(
        await readFile(path.join(materialized, 'src/presentation-kit', file), 'utf8'),
        await readFile(path.join(repo, 'src/presentation-kit', file), 'utf8'),
        `bootstrap scene-kit file matches: ${file}`,
      )
    }

    const manifest = JSON.parse(await readFile(path.join(materialized, 'package.json'), 'utf8'))
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) {
      assert.ok(manifest.dependencies?.[dependency] || manifest.devDependencies?.[dependency], `declares ${dependency}`)
    }
    assert.ok(manifest.scripts.verify && manifest.scripts.inspect)
    const skill = await readFile(path.join(skillRoot, 'SKILL.md'), 'utf8')
    assert.match(skill, /this skill's own directory/)
    assert.match(skill, /non-empty, unscaffolded target/)

    const cssFiles = [path.join(materialized, 'src/index.css'), ...canonicalFiles
      .filter(file => file.endsWith('.css'))
      .map(file => path.join(materialized, 'src/presentation-kit', file))]
    for (const full of cssFiles) {
      const file = path.relative(materialized, full)
      const css = await readFile(full, 'utf8')
      assert.doesNotMatch(css, /tailwind|--(?:color|font|space|shadow)-|#[\da-f]{3,8}\b|font-family\s*:|box-shadow\s*:/i, `no kit-owned visual defaults in ${file}`)
    }
    assert.doesNotMatch(JSON.stringify(manifest), /tailwind/i)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})
