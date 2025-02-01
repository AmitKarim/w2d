import esbuild from 'esbuild';
import shelljs from 'shelljs';
import inlineWorkerPlugin from 'esbuild-plugin-inline-worker';

async function startServer() {
  const ctx = await esbuild.context({
    entryPoints: ['src/App.ts'], // your entry file
    bundle: true,
    outfile: 'lib/index.js', // output file location
    sourcemap: true, // enable source maps
    // other configurations
    plugins: [inlineWorkerPlugin()],
  });

  shelljs.mkdir('lib')
  shelljs.cp('index.html', 'lib/index.html')
  shelljs.cp('-r', 'data', 'lib')

  await ctx.watch();

  const { host, port } = await ctx.serve({
    servedir: 'lib', // directory to serve
  });

  console.log(`Server started at http://${host}:${port}`);
}

startServer().catch(console.error);