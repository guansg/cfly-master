import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  plugins: [
    react(),
    electron([
      {
        // Main process
        entry: 'src/main/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron', 'better-sqlite3'],
              output: {
                format: 'es',  // 🔥 明确指定输出格式为 ES module
              },
            },
          },
        },
      },
      {
        // Preload scripts
        entry: 'src/preload/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron'], // 将 electron 标记为外部依赖
              output: {
                format: 'cjs', // 明确指定输出格式为 CommonJS
                entryFileNames: '[name].js',
              },
            },
          },
        },
      },
      {
        // Workflow Worker Thread entry
        entry: 'src/main/workflow/worker/workflow-worker.ts',
        vite: {
          // 子构建默认不继承根配置的 resolve.alias，需显式声明否则 @shared 等无法解析
          resolve: {
            alias: {
              '@': path.resolve(__dirname, './src'),
              '@main': path.resolve(__dirname, './src/main'),
              '@renderer': path.resolve(__dirname, './src/renderer'),
              '@shared': path.resolve(__dirname, './src/shared'),
            },
          },
          build: {
            outDir: 'dist/main',
            emptyOutDir: false,
            rollupOptions: {
              external: ['electron', 'better-sqlite3'],
              output: {
                format: 'es',
                entryFileNames: 'workflow-worker.js',
              },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5173,
  },
});

