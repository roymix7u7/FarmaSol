import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El backend vive en otro origen: en local es localhost:8080, y dentro de
// docker compose es el contenedor `back`. Se configura con VITE_API_PROXY_TARGET.
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        watch: {
            ignored: ['**/.vs/**']
        },
        proxy: {
            '/api': {
                target: apiTarget,
                changeOrigin: true
            }
        }
    }
})
