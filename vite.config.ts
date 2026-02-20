import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
    root: path.resolve(__dirname, 'src/presentation/react'),
    plugins: [react(), tsconfigPaths()],
    base: './',
    build: {
        outDir: path.resolve(__dirname, 'dist/presentation/react'),
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
});