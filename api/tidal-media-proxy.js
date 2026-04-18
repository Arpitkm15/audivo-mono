const TIDAL_AUDIO_HOST_PATTERN = /(^|\.)audio\.tidal\.com$/i;

function setCorsHeaders(req, res) {
    const origin = req.headers.origin;

    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, If-Range, Accept, User-Agent');
}

function getTargetRaw(req) {
    const { url } = req.query || {};
    if (Array.isArray(url)) return url[0] || '';
    return typeof url === 'string' ? url : '';
}

export default async function handler(req, res) {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.status(405).send('Method not allowed');
        return;
    }

    const targetRaw = getTargetRaw(req);
    if (!targetRaw) {
        res.status(400).send('Missing target URL');
        return;
    }

    let targetUrl;
    try {
        targetUrl = new URL(targetRaw);
    } catch {
        res.status(400).send('Invalid target URL');
        return;
    }

    if (targetUrl.protocol !== 'https:' || !TIDAL_AUDIO_HOST_PATTERN.test(targetUrl.hostname)) {
        res.status(403).send('Blocked target host');
        return;
    }

    const upstreamHeaders = {};
    const passThroughHeaders = ['range', 'if-range', 'accept', 'user-agent'];
    for (const headerName of passThroughHeaders) {
        const value = req.headers[headerName];
        if (typeof value === 'string' && value.length > 0) {
            upstreamHeaders[headerName] = value;
        }
    }

    try {
        const upstream = await fetch(targetUrl.toString(), {
            method: req.method,
            headers: upstreamHeaders,
            redirect: 'follow',
        });

        res.status(upstream.status);

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
                res.setHeader(name, value);
            }
        }

        if (req.method === 'HEAD') {
            res.end();
            return;
        }

        const body = await upstream.arrayBuffer();
        res.send(Buffer.from(body));
    } catch {
        res.status(502).send('Proxy request failed');
    }
}
