const TIDAL_AUDIO_HOST_PATTERN = /(^|\.)audio\.tidal\.com$/i;

function buildCorsHeaders(origin) {
    const headers = new Headers({
        Vary: 'Origin',
    });

    if (origin) {
        headers.set('Access-Control-Allow-Origin', origin);
    }

    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Range, If-Range, Accept, User-Agent');
    return headers;
}

export async function onRequest(context) {
    const { request } = context;
    const origin = request.headers.get('origin');
    const corsHeaders = buildCorsHeaders(origin);

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', {
            status: 405,
            headers: corsHeaders,
        });
    }

    const reqUrl = new URL(request.url);
    const targetRaw = reqUrl.searchParams.get('url');

    if (!targetRaw) {
        return new Response('Missing target URL', {
            status: 400,
            headers: corsHeaders,
        });
    }

    let targetUrl;
    try {
        targetUrl = new URL(targetRaw);
    } catch {
        return new Response('Invalid target URL', {
            status: 400,
            headers: corsHeaders,
        });
    }

    if (targetUrl.protocol !== 'https:' || !TIDAL_AUDIO_HOST_PATTERN.test(targetUrl.hostname)) {
        return new Response('Blocked target host', {
            status: 403,
            headers: corsHeaders,
        });
    }

    const upstreamHeaders = new Headers();
    const passThroughHeaders = ['range', 'if-range', 'accept', 'user-agent'];
    for (const headerName of passThroughHeaders) {
        const value = request.headers.get(headerName);
        if (value) {
            upstreamHeaders.set(headerName, value);
        }
    }

    try {
        const upstream = await fetch(targetUrl.toString(), {
            method: request.method,
            headers: upstreamHeaders,
            redirect: 'follow',
        });

        const headers = new Headers(corsHeaders);
        const passBackHeaders = [
            'content-type',
            'content-length',
            'accept-ranges',
            'content-range',
            'etag',
            'last-modified',
            'cache-control',
            'expires',
        ];

        for (const name of passBackHeaders) {
            const value = upstream.headers.get(name);
            if (value) {
                headers.set(name, value);
            }
        }

        return new Response(request.method === 'HEAD' ? null : upstream.body, {
            status: upstream.status,
            headers,
        });
    } catch {
        return new Response('Proxy request failed', {
            status: 502,
            headers: corsHeaders,
        });
    }
}
