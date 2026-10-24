// Starts a preview of the directory given as argv[2], then idles until a signal arrives.
import { exitOnSignals, startPreview } from '../../scripts/lib/preview.mjs'

const preview = await startPreview(process.argv[2])
exitOnSignals(() => preview.stop())
console.log(`READY ${preview.port}`)
setInterval(() => undefined, 1000)
