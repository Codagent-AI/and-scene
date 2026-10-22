import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const kitDir = path.resolve(import.meta.dirname, '..')
const rootDir = path.resolve(kitDir, '..', '..')

function kitFiles(dir = kitDir): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : kitFiles(full)
    return [full]
  })
}

const sources = kitFiles().map((file) => ({ file: path.relative(kitDir, file), text: fs.readFileSync(file, 'utf8') }))

describe('the kit ships no visual defaults', () => {
  it('contains no stylesheets and imports none', () => {
    expect(sources.filter((s) => /\.(css|scss|sass|less|pcss)$/.test(s.file))).toEqual([])
    for (const { file, text } of sources) expect(text, file).not.toMatch(/import\s+['"][^'"]+\.(css|scss|less)['"]/)
  })

  it('declares no visual style properties or values', () => {
    const style =
      /\b(color|background|backgroundColor|border|borderColor|borderRadius|boxShadow|textShadow|fontFamily|fontSize|fontWeight|padding|gap|outline|filter)\s*:/
    for (const { file, text } of sources) {
      expect(text, file).not.toMatch(style)
      expect(text, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|var\(--|currentColor/)
    }
  })

  it('does not set stroke or fill on SVG', () => {
    for (const { file, text } of sources) expect(text, file).not.toMatch(/\b(stroke|fill)(-width)?=/)
  })

  it('uses no styling-framework classes, injected styles, or framework imports', () => {
    for (const { file, text } of sources) {
      expect(text, file).not.toMatch(/tailwind|styled-components|@emotion|<style|createElement\(['"]style/i)
      expect(text, file).not.toMatch(/className=["'`]/)
    }
  })

  it('imports only react, motion and lucide-react from outside the kit', () => {
    const allowed = new Set(['react', 'motion/react', 'lucide-react'])
    for (const { file, text } of sources) {
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        if (!m[1].startsWith('.')) expect(allowed.has(m[1]), `${file}: ${m[1]}`).toBe(true)
      }
    }
  })
})

describe('no styling framework is required', () => {
  const manifests = [
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'skills/presentation/templates/bootstrap/package.json'),
  ]
  const configs = [
    path.join(rootDir, 'vite.config.ts'),
    path.join(rootDir, 'skills/presentation/templates/bootstrap/vite.config.ts'),
  ]

  it.each(manifests)('%s declares no CSS framework', (manifest) => {
    if (!fs.existsSync(manifest)) return
    const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names.filter((n) => /tailwind|postcss|autoprefixer|styled-components|emotion|sass|less|bootstrap|chakra|mui/i.test(n))).toEqual([])
  })

  it.each(configs)('%s uses no styling plugin', (config) => {
    if (!fs.existsSync(config)) return
    expect(fs.readFileSync(config, 'utf8')).not.toMatch(/tailwind|postcss/i)
  })
})
