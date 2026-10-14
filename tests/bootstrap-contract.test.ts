import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

const template = 'skills/presentation/templates/bootstrap/'
it('ships complete dependencies, build and inspection commands with committed lock data', () => {
  const pkg = JSON.parse(readFileSync(`${template}package.json`, 'utf8'))
  const required = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const name of required) expect(dependencies[name], name).toBeTruthy()
  expect(Object.keys(dependencies).join(' ')).not.toMatch(/tailwind|bootstrap|styled-components|@emotion/i)
  expect(pkg.scripts.build).toBe('tsc -b && vite build')
  for (const name of ['dev', 'lint', 'preview', 'verify', 'inspect']) expect(pkg.scripts[name], name).toBeTruthy()
  const lock = JSON.parse(readFileSync(`${template}package-lock.json`, 'utf8'))
  expect(lock.packages[''].dependencies).toEqual(pkg.dependencies)
  expect(lock.packages[''].devDependencies).toEqual(pkg.devDependencies)
  expect(readFileSync(`${template}.gitignore`, 'utf8')).toContain('.inspection/')
})

it('keeps browser drivers and their shared preview helper byte-aligned with their release snapshots', () => {
  for (const name of ['verify.mjs', 'inspect-presentation.mjs', 'browser-preview.mjs']) {
    expect(readFileSync(`${template}scripts/${name}`)).toEqual(readFileSync(`scripts/${name}`))
  }
})

it('bootstrap host and presentation stub supply no visual theme or reference sample', () => {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
      entry.isDirectory() ? files(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`])
  }
  const sources = [...files(`${template}src`), ...files('skills/presentation/templates/presentation')]
  for (const file of sources.filter(file => /\.(css|tsx?)$/.test(file))) {
    const source = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(source, file).not.toMatch(/(?:color|background[\w-]*|font[\w-]*|border[\w-]*|box-shadow|text-shadow|padding[\w-]*|gap)\s*:/)
    expect(source, file).not.toContain('how-to-make-a-presentation')
  }
})

it('resolves the skill’s template links from its own directory', () => {
  const skillDirectory = resolve('skills/presentation')
  const skill = readFileSync(`${skillDirectory}/SKILL.md`, 'utf8')
  const links = [...skill.matchAll(/\]\((templates\/[^)]+)\)/g)].map(match => match[1])
  expect(links).toContain('templates/bootstrap/')
  expect(links).toContain('templates/presentation/')
  for (const link of links) expect(existsSync(resolve(skillDirectory, link)), link).toBe(true)
})
