import { readFile, readdir } from 'node:fs/promises'
import { expect, it } from 'vitest'
it('I-26 kit stays visually neutral while sample owns active state and attribution CSS', async () => {
  const directory='src/presentation-kit'
  const files=await readdir(directory,{recursive:true})
  for (const file of files.filter(f=>/\.tsx?$/.test(f))) {
    const source=await readFile(`${directory}/${file}`,'utf8')
    expect(source,file).not.toMatch(/import\s+['"][^'"]+\.css|#[\da-f]{3,8}\b|(?:color|background|fontFamily|fontSize|fontWeight|borderRadius|boxShadow)\s*:/i)
    expect(source,file).not.toMatch(/tailwind|--theme|--color-/i)
  }
  const css=await readFile('src/presentations/how-to-make-a-presentation/presentation.css','utf8')
  expect(css).toMatch(/\[data-presentation-active="true"\]\s*\{[^}]*background:[^}]*color:/)
  expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*font-size: 12px/)
  expect(css).toMatch(/\.ghost-card\s*\{[^}]*border: 1px dashed/)
  expect(css).toMatch(/\.tray\s*\{[^}]*border: 0/)
})
