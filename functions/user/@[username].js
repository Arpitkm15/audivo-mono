// functions/user/@[username].js

const PROFILES_TABLE = 'profiles';

function getSupabaseConfig(env) {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }

    return { supabaseUrl, supabaseAnonKey };
}

async function fetchProfileByUsername(supabaseUrl, supabaseAnonKey, username) {
    const url = new URL(`${supabaseUrl}/rest/v1/${PROFILES_TABLE}`);
    url.searchParams.set('select', 'username,display_name,avatar_url,banner,about,status');
    url.searchParams.set('username', `eq.${username}`);
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

export async function onRequest(context) {
    const { request, params, env } = context;
    const userAgent = request.headers.get('User-Agent') || '';
    const isBot =
        /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
            userAgent
        );
    const username = params.username;

    if (isBot && username) {
        try {
            const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig(env);
            const profile = await fetchProfileByUsername(supabaseUrl, supabaseAnonKey, username);

            if (profile) {
                const displayName = profile.display_name || profile.username;
                const title = `${displayName} (@${profile.username})`;
                let description = profile.about || `View ${displayName}'s profile on Monochrome.`;

                if (profile.status) {
                    try {
                        const statusObj = JSON.parse(profile.status);
                        description = `Listening to: ${statusObj.text}\n\n${description}`;
                    } catch {
                        description = `Listening to: ${profile.status}\n\n${description}`;
                    }
                }

                const imageUrl = profile.avatar_url || 'https://audivo.in/icon.jpg';
                const bannerUrl = profile.banner || '';
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
                        <meta property="og:type" content="profile">
                        <meta property="og:url" content="${pageUrl}">
                        
                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="${title}">
                        <meta name="twitter:description" content="${description}">
                        <meta name="twitter:image" content="${imageUrl}">
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <p>${description}</p>
                        <img src="${imageUrl}" alt="Profile Avatar">
                        ${bannerUrl ? `<img src="${bannerUrl}" alt="Profile Banner">` : ''}
                    </body>
                    </html>
                `;

                return new Response(metaHtml, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
            }
        } catch (error) {
            console.error(`Error for user profile ${username}:`, error);
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
