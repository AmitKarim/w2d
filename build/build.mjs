import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['../src/App.ts'],
  bundle: true,
  outfile: '../lib/out.js',
})

