import { defineConfig } from 'vite'

export default defineConfig({
    base: './',
    build: {
        assetsInlineLimit: 0,
        rollupOptions: {
            input: {
                main: 'index.html',
                blog: 'blog.html'
            }
        }
    },
    server: {
        port: 3000
    }
}) 