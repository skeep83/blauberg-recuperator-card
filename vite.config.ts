import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        open: '/preview.html',
    },
    build: {
        lib: {
            entry: 'src/blauberg-recuperator-card.ts',
            name: 'BlaubergRecuperatorCard',
            formats: ['es'],
            fileName: () => 'blauberg-recuperator-card.js',
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
        minify: 'terser',
    },
});
