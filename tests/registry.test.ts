// @vitest-environment node
import { it, expect } from 'vitest'
import { registryEntries, requireRegistration } from '../scripts/registry.mjs'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { resolve, join } from 'node:path'
it('I-32 registry checks actual slug properties rather than comments titles or imports',async()=>{
 const source=`// how-to-make-a-presentation
 export const presentations = [{slug:'another',title:'how-to-make-a-presentation',load:()=>import('./how-to-make-a-presentation/Talk')}] as const`;
 expect(registryEntries(source)).toEqual([{slug:'another',module:'./how-to-make-a-presentation/Talk'}]);
 const dir=await mkdtemp(resolve('.work/registry-'));
 try {const file=join(dir,'index.ts');await writeFile(file,source);await expect(requireRegistration('how-to-make-a-presentation',file)).rejects.toThrow('sample missing registration: how-to-make-a-presentation');await expect(requireRegistration('another',file)).rejects.toThrow('sample missing entry module: another');await writeFile(join(dir,'present.tsx'),'export default null');await writeFile(file,`export const presentations=[{slug:'another',load:()=>import('./present')}]`);await expect(requireRegistration('another',file)).resolves.toBeUndefined()}finally{await rm(dir,{recursive:true,force:true})}
})
