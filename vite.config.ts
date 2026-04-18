import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import authGatePlugin from './vite-plugin-auth-gate.js';
import path from 'path';
import uploadPlugin from './vite-plugin-upload.js';
import blobAssetPlugin from './vite-plugin-blob.js';
import svgUse from './vite-plugin-svg-use.js';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
// import purgecss from 'vite-plugin-purgecss';
import purgecss from 'vite-plugin-purgecss';
import { execSync } from 'child_process';
import { playwright } from '@vitest/browser-playwright';

function getGitCommitHash() {
    try {
        return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
        return 'unknown';
    }
}

function tidalMediaDevProxyPlugin() {
    const allowedHostPattern = /(^|\.)audio\.tidal\.com$/i;

    return {
        name: 'tidal-media-dev-proxy',
        apply: 'serve' as const,
        configureServer(server: any) {
            server.middlewares.use('/__tidal_media_proxy', async (req: IncomingMessage, res: ServerResponse) => {
                if (!req.url) {
                    res.statusCode = 400;
                    res.end('Missing URL');
                    return;
                }

                const requestUrl = new URL(req.url, 'http://localhost');
                const targetRaw = requestUrl.searchParams.get('url');

                if (!targetRaw) {
                    res.statusCode = 400;
                    res.end('Missing target URL');
                    return;
                }

                let targetUrl;
                try {
                    targetUrl = new URL(targetRaw);
                } catch {
                    res.statusCode = 400;
                    res.end('Invalid target URL');
                    return;
                }

                if (targetUrl.protocol !== 'https:' || !allowedHostPattern.test(targetUrl.hostname)) {
                    res.statusCode = 403;
                    res.end('Blocked target host');
                    return;
                }

                const method = req.method || 'GET';
                if (method !== 'GET' && method !== 'HEAD') {
                    res.statusCode = 405;
                    res.end('Method not allowed');
                    return;
                }

                const headers = new Headers();
                const passThroughHeaders = ['range', 'if-range', 'accept', 'user-agent'];
                for (const headerName of passThroughHeaders) {
                    const value = req.headers[headerName];
                    if (typeof value === 'string' && value.length > 0) {
                        headers.set(headerName, value);
                    }
                }

                try {
                    const upstream = await fetch(targetUrl.toString(), {
                        method,
                        headers,
                        redirect: 'follow',
                    });

                    res.statusCode = upstream.status;

                    const responseHeaders = [
                        'content-type',
                        'content-length',
                        'accept-ranges',
                        'content-range',
                        'etag',
                        'last-modified',
                        'cache-control',
                        'expires',
                    ];

                    for (const headerName of responseHeaders) {
                        const value = upstream.headers.get(headerName);
                        if (value) {
                            res.setHeader(headerName, value);
                        }
                    }

                    if (method === 'HEAD' || !upstream.body) {
                        res.end();
                        return;
                    }

                    Readable.fromWeb(upstream.body).pipe(res);
                } catch {
                    res.statusCode = 502;
                    res.end('Proxy request failed');
                }
            });
        },
    };
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
                stream: path.resolve(__dirname, 'stream-stub.js'), // Stub for stream module
            },
        },
        optimizeDeps: {
            exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@supabase/supabase-js'],
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
            tidalMediaDevProxyPlugin(),
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
                            src: '/icon.jpg',
                            type: 'image/jpeg',
                            sizes: '48x48',
                            purpose: 'any maskable',
                        },
                        {
                            src: '/icon.jpg',
                            type: 'image/jpeg',
                            sizes: '72x72',
                            purpose: 'any maskable',
                        },
                        {
                            src: '/icon.jpg',
                            type: 'image/jpeg',
                            sizes: '96x96',
                            purpose: 'any maskable',
                        },
                        {
                            src: '/icon.jpg',
                            type: 'image/jpeg',
                            sizes: '128x128',
                            purpose: 'any maskable',
                        },
                        {
                            src: '/icon.jpg',
                            type: 'image/jpeg',
                            sizes: '192x192',
                            purpose: 'any maskable',
                        },
                        {
                            src: '/icon.jpg',
                            type: 'image/jpeg',
                            sizes: '256x256',
                            purpose: 'any maskable',
                        },
                        {
                            src: '/icon.jpg',
                            type: 'image/jpeg',
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
                            icons: [{ src: '/icon.jpg', sizes: '96x96', type: 'image/jpeg' }],
                        },
                    ],
                },
            }),
        ],
    };
});
