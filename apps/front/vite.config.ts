import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El backend vive en otro origen: en local es localhost:8080, y dentro de
// docker compose es el contenedor `back`. Se configura con VITE_API_PROXY_TARGET.
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080'

// Dentro de Docker hay que sondear los archivos en vez de esperar avisos del
// sistema: los bind mounts de Windows y Mac no propagan los eventos de cambio al
// contenedor, y sin esto Vite nunca se entera de que editaste algo (sirve su
// copia en cache y parece que tu cambio no hizo nada). Fuera de Docker se deja
// apagado, porque sondear gasta CPU sin necesidad.
const usePolling = process.env.VITE_USE_POLLING === 'true'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        allowedHosts: true, // <-- AGREGA ESTA LÍNEA AQUÍ
        watch: {
            ignored: ['**/.vs/**'],
            usePolling,
            interval: 300
        },
        proxy: {
            '/api': {
                target: apiTarget,
                changeOrigin: true,
                // Para el navegador, /api es su mismo origen: esto no es una
                // petición entre sitios. Pero reenvía el Origin de la página, y el
                // backend solo acepta los de CORS_ORIGINS: quien abría la app por
                // la IP de la red o por un túnel veía los productos (los GET no
                // mandan Origin) pero no podía iniciar sesión (403 "Invalid CORS
                // request"). Quitarlo aquí no abre nada en producción: este proxy
                // solo existe en `npm run dev`.
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
                }
            }
        }
    }
})