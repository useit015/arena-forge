import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'three/addons',
        replacement: path.resolve(__dirname, 'node_modules/three/examples/jsm'),
      },
      { find: 'three/tsl', replacement: path.resolve(__dirname, 'src/editor/core/ThreeShim.js') },
      {
        find: 'three/webgpu',
        replacement: path.resolve(__dirname, 'src/editor/core/ThreeShim.js'),
      },
      { find: /^three$/, replacement: path.resolve(__dirname, 'src/editor/core/ThreeShim.js') },
      {
        find: /.*\/build\/three\.module\.js$/,
        replacement: path.resolve(__dirname, 'src/editor/core/ThreeShim.js'),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['three'],
  },
});
