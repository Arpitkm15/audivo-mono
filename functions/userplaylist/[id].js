// functions/userplaylist/[id].js

const PUBLIC_COLLECTION = 'public_playlists';

function getSupabaseConfig(env) {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }

    return { supabaseUrl, supabaseAnonKey };
}

async function fetchPublicPlaylistByUuid(supabaseUrl, supabaseAnonKey, playlistId) {
    const url = new URL(`${supabaseUrl}/rest/v1/${PUBLIC_COLLECTION}`);
    url.searchParams.set('select', '*');
    url.searchParams.set('uuid', `eq.${playlistId}`);
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
        headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
        },
    });

    if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

function safeParseTracks(tracksData) {
    if (!tracksData) return [];
    if (Array.isArray(tracksData)) return tracksData;
    if (typeof tracksData === 'string') {
        try {
            return JSON.parse(tracksData);
        } catch {
            return [];
        }
    }
    return [];
}

function parseDuration(durationStr) {
    if (!durationStr || durationStr === 'N/A' || typeof durationStr !== 'string') return 0;
    const parts = durationStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
}

function calculatePlaylistDuration(tracks) {
    let totalSeconds = 0;
    for (const track of tracks) {
        const duration = track.duration || track.durationSeconds || 0;
        if (typeof duration === 'number') {
            totalSeconds += duration;
        } else if (typeof duration === 'string') {
            totalSeconds += parseDuration(duration);
        }
    }
    return totalSeconds;
}

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
}

export async function onRequest(context) {
    const { request, params, env } = context;
    const userAgent = request.headers.get('User-Agent') || '';
    const isBot =
        /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
            userAgent
        );
    const playlistId = params.id;

    if (isBot && playlistId) {
        try {
            const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig(env);
            const record = await fetchPublicPlaylistByUuid(supabaseUrl, supabaseAnonKey, playlistId);

            if (record) {
                let extraData = {};
                try {
                    extraData = record.data ? JSON.parse(record.data) : {};
                } catch {
                    extraData = {};
                }

                const title =
                    record.title ||
                    record.name ||
                    (extraData && (extraData.title || extraData.name)) ||
                    'Untitled Playlist';

                let tracks = safeParseTracks(record.tracks);
                const trackCount = tracks.length;
                const totalDuration = calculatePlaylistDuration(tracks);
                const durationStr = formatDuration(totalDuration);

                let rawCover = record.image || record.cover || record.playlist_cover || '';
                if (!rawCover && extraData && typeof extraData === 'object') {
                    rawCover = extraData.cover || extraData.image || '';
                }

                let imageUrl = '';
                if (rawCover && (rawCover.startsWith('http') || rawCover.startsWith('data:'))) {
                    imageUrl = rawCover;
                } else if (rawCover) {
                    imageUrl = rawCover;
                }

                if (!imageUrl && tracks.length > 0) {
                    const firstCover = tracks.find((t) => t.album?.cover)?.album?.cover;
                    if (firstCover) {
                        const formattedId = String(firstCover).replace(/-/g, '/');
                        imageUrl = `https://resources.tidal.com/images/${formattedId}/1080x1080.jpg`;
                    }
                }

                if (!imageUrl) {
                    imageUrl = 'https://audivo.in/icon.jpg';
                }

                const description = `Playlist • ${trackCount} Tracks • ${durationStr}\nListen on Monochrome`;
                const pageUrl = new URL(request.url).href;

                const metaHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>${title}</title>
                        <meta name="description" content="${description}">
                        <meta name="theme-color" content="#000000">

                        <meta property="og:site_name" content="Monochrome">
                        <meta property="og:title" content="${title}">
                        <meta property="og:description" content="${description}">
                        <meta property="og:image" content="${imageUrl}">
                        <meta property="og:type" content="music.playlist">
                        <meta property="og:url" content="${pageUrl}">
                        <meta property="music:song_count" content="${trackCount}">

                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${title}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <p>${description}</p>
                        <img src="${imageUrl}" alt="Playlist Cover">
                    </body>
                    </html>
                `;

                return new Response(metaHtml, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
            }
        } catch (error) {
            console.error(`Error for user playlist ${playlistId}:`, error);
        }
    }

    // For non-bots, return the main app HTML to enable client-side routing
    const mainHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>audivo.in</title>
            <meta name="description" content="A minimalist music streaming application">
            <meta name="theme-color" content="#000000">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
            <div id="app"></div>
            <script type="module" src="/js/app.js"></script>
        </body>
        </html>
    `;
    
    return new Response(mainHtml, {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
}
