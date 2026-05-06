import {
    defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000
    },
    build: {
        outDir: 'dist'
    },
    define: {
        'import.meta.env.VITE_BACKEND_URL': JSON.stringify('http://localhost:3001')
    }
})