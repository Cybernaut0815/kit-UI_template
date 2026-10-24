import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' so the static output works from any sub-path (e.g. a Pages project dir).
export default defineConfig({ plugins: [react()], base: './' });
