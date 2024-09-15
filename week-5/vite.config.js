import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         crypto: 'crypto-browserify',
       },
     },
     optimizeDeps: {
       esbuildOptions: {
         define: {
           global: 'globalThis',
         },
         plugins: [
           NodeGlobalsPolyfillPlugin({
             crypto: true,
           }),
         ],
       },
     },
   })