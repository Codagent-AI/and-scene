// @vitest-environment node
import { afterAll, expect, it } from 'vitest'
import { cp, mkdtemp, readFile, readdir, rm, writeFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { scaffold, filesUnder, anchorFor } from '../skills/presentation/scripts/scaffold.mjs'
const exec=promisify(execFile)
const temporary:string[]=[]
afterAll(async()=>{await Promise.all(temporary.map(dir=>rm(dir,{recursive:true,force:true})))})
it('INT-001 materialized bootstrap is complete, portable, style-neutral, and aligned',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'and-scene-bootstrap-'));temporary.push(directory)
 const materialize=await exec('node',[path.resolve('skills/presentation/scripts/scaffold.mjs'),directory],{cwd:tmpdir(),timeout:120000,maxBuffer:4e6});console.log(materialize.stdout)
 expect(materialize.stdout).toContain('src/presentation-kit/Presentation.tsx')
 const {stdout}=await exec('npm',['run','verify'],{cwd:directory,timeout:120000,maxBuffer:4e6});console.log(stdout)
 expect(stdout).toContain('PASS:');expect(stdout).toContain('127.0.0.1')
 for(const file of await filesUnder(path.resolve('src/presentation-kit')))expect(await readFile(path.join(directory,'src/presentation-kit',file),'utf8')).toBe(await readFile(path.join('src/presentation-kit',file),'utf8'))
 for(const file of await readdir('scripts'))if(file.endsWith('.mjs'))expect(await readFile(path.join(directory,'scripts',file),'utf8')).toBe(await readFile(path.join('scripts',file),'utf8'))
 const manifest=JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'))
 const deps={...manifest.dependencies,...manifest.devDependencies}
 for(const dependency of ['react','react-dom','motion','lucide-react','vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright'])expect(deps[dependency]).toBeTruthy()
 expect(Object.keys(deps).some(key=>key.includes('tailwind'))).toBe(false)
 for(const file of ['src/presentations/index.ts','src/presentation-kit/Presentation.tsx','vite.config.ts'])await access(path.join(directory,file))
 const kit=(await Promise.all((await filesUnder(path.join(directory,'src/presentation-kit'))).map(file=>readFile(path.join(directory,'src/presentation-kit',file),'utf8')))).join('\n')
 expect(kit).not.toMatch(/#[0-9a-f]{3,8}\b|fontFamily|boxShadow|borderRadius|backgroundColor|padding:\s*['"]/) // geometry is allowed; visual defaults are not
 expect(await readFile(path.join(directory,'src/index.css'),'utf8')).not.toMatch(/color:|font:|background:|border:|shadow:|--/)
})
it('INT-001 partial scaffold preserves anchors and refuses unconfirmed non-empty writes',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'and-scene-partial-'));temporary.push(directory)
 const original=JSON.stringify({name:'existing',scripts:{build:'existing-build'},dependencies:{react:'^19.2.6'}})
 await writeFile(path.join(directory,'package.json'),original)
 await expect(scaffold(directory,{missing:['kit','index'],install:false})).rejects.toThrow(/confirmation required/)
 expect(await readFile(path.join(directory,'package.json'),'utf8')).toBe(original)
 const result=await scaffold(directory,{missing:['kit','index'],confirmed:true,install:false})
 expect(result.copied).toContain('src/presentation-kit/Presentation.tsx')
 expect(JSON.parse(await readFile(path.join(directory,'package.json'),'utf8')).scripts.build).toBe('existing-build')
 expect(await readdir(directory)).not.toContain('vite.config.ts')
 const again=await scaffold(directory,{missing:['kit','index'],confirmed:true,install:false})
 expect(again.copied).toEqual([]);expect(again.preserved).toContain('src/presentations/index.ts')
 await expect(scaffold(directory,{missing:['invalid'],confirmed:true,install:false})).rejects.toThrow(/unknown anchor/)
 expect(anchorFor('src/presentation-kit/Box.tsx')).toBe('kit');expect(anchorFor('src/main.tsx')).toBe('index')
})

it('INT-001 kit-only partial scaffold preserves an existing registry and verifies its selected route',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'and-scene-existing-index-'));temporary.push(directory)
 for(const file of ['src','package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json'])await cp(file,path.join(directory,file),{recursive:true})
 await rm(path.join(directory,'src/presentation-kit'),{recursive:true})
 const manifest=JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'));delete manifest.scripts.verify
 await writeFile(path.join(directory,'package.json'),JSON.stringify(manifest))
 const registry=await readFile(path.join(directory,'src/presentations/index.ts'),'utf8')
 await expect(scaffold(directory,{missing:['kit'],confirmed:true,install:false})).rejects.toThrow(/registered route.*verifySlug/)
 await expect(scaffold(directory,{missing:['kit'],confirmed:true,install:false,verifySlug:'bad;command'})).rejects.toThrow(/invalid verification slug/)
 await expect(access(path.join(directory,'src/presentation-kit'))).rejects.toThrow()
 await scaffold(directory,{missing:['kit'],confirmed:true,verifySlug:'how-to-make-a-presentation'})
 expect(await readFile(path.join(directory,'src/presentations/index.ts'),'utf8')).toBe(registry)
 expect(await readdir(path.join(directory,'src/presentations'))).not.toContain('getting-started')
 const {stdout}=await exec('npm',['run','verify'],{cwd:directory,timeout:120000,maxBuffer:4e6});console.log(stdout)
 expect(stdout).toContain('PASS:');expect(stdout).toContain('render: step 8 OK')
})
