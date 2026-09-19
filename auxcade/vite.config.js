import { defineConfig } from 'vite';
export default defineConfig({
    // Relative assets work at /, /auxcade/, or any GitHub Pages repository path.
    base: './',
    server: { host: '0.0.0.0', port: 4173, strictPort: true, allowedHosts: ['terminal.local'] },
    build: { target: 'es2022' },
});
