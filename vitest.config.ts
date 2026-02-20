import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
    plugins: [tsconfigPaths()],
    resolve: {
        alias: {
            '@core/application': path.resolve(__dirname, 'src/application'),
            '@core/domain': path.resolve(__dirname, 'src/domain'),
            '@core/infrastructure': path.resolve(__dirname, 'src/infrastructure'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: [
            'tests/**/*.{test,spec}.ts',
            'src/**/*.{test,spec}.{ts,tsx}',
        ],
    },
});
