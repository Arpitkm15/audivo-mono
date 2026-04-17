import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import authGatePlugin from './vite-plugin-auth-gate.js';
import path from 'path';
import uploadPlugin from './vite-plugin-upload.js';
import blobAssetPlugin from './vite-plugin-blob.js';
import svgUse from './vite-plugin-svg-use.js';
// import purgecss from 'vite-plugin-purgecss';
import purgecss from 'vite-plugin-purgecss';
import { execSync } from 'child_process';
import { playwright } from '@vitest/browser-playwright';

function getGitCommitHash() {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
        return 'unknown';
    }
}

export default defineConfig((_options) => {
    const commitHash = getGitCommitHash();

    return {
        test: {
            // https://vitest.dev/guide/browser/
            browser: {
                enabled: true,
                provider: playwright(),
                headless: !!process.env.HEADLESS,
                instances: [{ browser: 'chromium' }],
            },
        },
        base: '/',
        define: {
            __COMMIT_HASH__: JSON.stringify(commitHash),
            __VITEST__: !!process.env.VITEST,
        },
        worker: {
            format: 'es',
        },
        resolve: {
            alias: {
                '!lucide': '/node_modules/lucide-static/icons',
                '!simpleicons': '/node_modules/simple-icons/icons',
                '!': '/node_modules',

                events: '/node_modules/events/events.js',
                pocketbase: '/node_modules/pocketbase/dist/pocketbase.es.js',
                stream: path.resolve(__dirname, 'stream-stub.js'), // Stub for stream module
            },
        },
        optimizeDeps: {
            exclude: ['pocketbase', '@ffmpeg/ffmpeg', '@ffmpeg/util'],
        },
        server: {
            fs: {
                allow: ['.', 'node_modules'],
                // host: true,
                // allowedHosts: ['<your_tailscale_hostname>'], // e.g. pi5.tailf5f622.ts.net
            },
        },
        // preview: {
        //     host: true,
        //     allowedHosts: ['<your_tailscale_hostname>'], // e.g. pi5.tailf5f622.ts.net
        // },
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            sourcemap: true,
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
            },
            rollupOptions: {
                treeshake: true,
            },
        },
        plugins: [
            purgecss({
                variables: false, // DO NOT REMOVE UNUSED VARIABLES (breaks web components like am-lyrics)
                safelist: {
                    standard: [
                        /^am-lyrics/,
                        /^lyplus-/,
                        'sidepanel',
                        'side-panel',
                        'active',
                        'show',
                        /^data-/,
                        /^modal-/,
                    ],
                    deep: [/^am-lyrics/],
                    greedy: [/^lyplus-/, /sidepanel/, /side-panel/],
                },
            }),
            authGatePlugin(),
            uploadPlugin(),
            blobAssetPlugin(),
            svgUse(),
            VitePWA({
                registerType: 'autoUpdate',
                injectRegister: 'auto',
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
                    cleanupOutdatedCaches: true,
                    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB limit
                    navigateFallback: 'index.html',
                    // Define runtime caching strategies
                    runtimeCaching: [
                        {
                            urlPattern: ({ request }) => request.destination === 'image',
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'images',
                                expiration: {
                                    maxEntries: 100,
                                    maxAgeSeconds: 60 * 24 * 60 * 60, // 60 Days
                                },
                            },
                        },
                        {
                            urlPattern: ({ request }) =>
                                request.destination === 'audio' || request.destination === 'video',
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'media',
                                expiration: {
                                    maxEntries: 50,
                                    maxAgeSeconds: 60 * 24 * 60 * 60, // 60 Days
                                },
                                rangeRequests: true, // Support scrubbing
                            },
                        },
                    ],
                },
                includeAssets: ['discord.html'],
                manifest: {
                    name: 'audivo',
                    short_name: 'audivo',
                    description: 'A minimalist music streaming application',
                    start_url: '/',
                    scope: '/',
                    display: 'standalone',
                    display_override: ['window-controls-overlay'],
                    background_color: '#000000',
                    theme_color: '#000000',
                    orientation: 'portrait-primary',
                    categories: ['music', 'entertainment'],
                    icons: [
                        {
                            src: 'assets/icons/icon-48.webp',
                            type: 'image/webp',
                            sizes: '48x48',
                            purpose: 'any maskable',
                        },
                        {
                            src: 'assets/icons/icon-72.webp',
                            type: 'image/webp',
                            sizes: '72x72',
                            purpose: 'any maskable',
                        },
                        {
                            src: 'assets/icons/icon-96.webp',
                            type: 'image/webp',
                            sizes: '96x96',
                            purpose: 'any maskable',
                        },
                        {
                            src: 'assets/icons/icon-128.webp',
                            type: 'image/webp',
                            sizes: '128x128',
                            purpose: 'any maskable',
                        },
                        {
                            src: 'assets/icons/icon-192.webp',
                            type: 'image/webp',
                            sizes: '192x192',
                            purpose: 'any maskable',
                        },
                        {
                            src: 'assets/icons/icon-256.webp',
                            type: 'image/webp',
                            sizes: '256x256',
                            purpose: 'any maskable',
                        },
                        {
                            src: 'assets/icons/icon-512.webp',
                            type: 'image/webp',
                            sizes: '512x512',
                            purpose: 'any maskable',
                        },
                        {
                            src: 'assets/192.png',
                            type: 'image/png',
                            sizes: '192x192',
                            purpose: 'any maskable',
                        },
                        {
                            src: 'assets/512.png',
                            type: 'image/png',
                            sizes: '512x512',
                            purpose: 'any maskable',
                        },
                    ],
                    shortcuts: [
                        {
                            name: 'Search',
                            short_name: 'Search',
                            description: 'Search for music',
                            url: '/#search',
                            icons: [{ src: 'assets/96.png', sizes: '96x96', type: 'image/png' }],
                        },
                    ],
                },
            }),
        ],
    };
});
