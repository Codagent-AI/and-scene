import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, it } from 'vitest'
it('INT-001 materializes bootstrap and preserves kit parity', () => {
 const dir=mkdtempSync(join(tmpdir(),'and-scene-'))
 try {
  cpSync('skills/presentation/templates/bootstrap',dir,{recursive:true})
  execFileSync('npm',['ci','--ignore-scripts'],{cwd:dir,stdio:'pipe',timeout:180000})
  execFileSync('npm',['run','verify'],{cwd:dir,stdio:'pipe',timeout:120000})
  const compare=(a:string,b:string) => { for(const entry of readdirSync(a,{withFileTypes:true})) { if(entry.isDirectory()) compare(join(a,entry.name),join(b,entry.name)); else expect(readFileSync(join(a,entry.name))).toEqual(readFileSync(join(b,entry.name))) } }
  compare(resolve('src/presentation-kit'),join(dir,'src/presentation-kit'))
  const pkg=JSON.parse(readFileSync(join(dir,'package.json'),'utf8'))
  for(const name of ['react','react-dom','motion','lucide-react']) expect(pkg.dependencies[name]).toBeTruthy()
  for(const name of ['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','playwright']) expect(pkg.devDependencies[name]).toBeTruthy()
  expect(JSON.stringify(pkg)).not.toMatch(/tailwindcss|@tailwindcss|bootstrap|bulma|daisyui|@mui\/|@chakra-ui\//i)
  const scan=(path:string) => { for(const item of readdirSync(path,{withFileTypes:true})) { const file=join(path,item.name); if(item.isDirectory()) scan(file); else if(/\.(css|tsx?|jsx?)$/.test(file)) { const content=readFileSync(file,'utf8'); expect(content, file).not.toMatch(/(?:^|[;{])\s*(?:color|background(?:-color)?|font(?:-family|-size)?|border(?:-color|-radius)?|box-shadow|text-shadow|--[\w-]+)\s*:/im); expect(content, file).not.toMatch(/['"]?(?:color|background|backgroundColor|font|fontFamily|fontSize|border|borderColor|borderRadius|boxShadow|textShadow|--[\w-]+)['"]?\s*:/); expect(content, file).not.toMatch(/(?:from\s*|import\s*|require\s*\()\s*['"](?:tailwindcss|@tailwindcss\/|bootstrap|bulma|daisyui|@mui\/|@chakra-ui\/)/) } } }
  scan(join(dir,'src')); expect(readdirSync(dir).filter(name => /^(tailwind|postcss)\.config\./i.test(name))).toEqual([]); for(const config of ['vite.config.ts','package.json','index.html']) expect(readFileSync(join(dir,config),'utf8')).not.toMatch(/tailwind|bootstrap|bulma|daisyui|@mui\/|@chakra-ui\/|@theme|--[a-z][\w-]*\s*:/i)
  for(const file of ['verify.mjs','inspect-presentation.mjs']) expect(readFileSync(join(dir,'scripts',file))).toEqual(readFileSync(resolve('scripts',file)))
 } finally { rmSync(dir,{recursive:true,force:true}) }
},300000)
