export async function onRequest(context) {
    const { request } = context;
    const userAgent = request.headers.get('User-Agent') || '';
    const isBot =
        /discordbot|twitterbot|facebookexternalhit|bingbot|googlebot|slurp|whatsapp|pinterest|slackbot|telegrambot|linkedinbot|mastodon|signal|snapchat|redditbot|skypeuripreview|viberbot|linebot|embedly|quora|outbrain|tumblr|duckduckbot|yandexbot|rogerbot|showyoubot|kakaotalk|naverbot|seznambot|mediapartners|adsbot|petalbot|applebot|ia_archiver/i.test(
            userAgent
        );

    if (isBot) {
        const pageUrl = request.url;
        const metaHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>audivo.in | Downloads</title>
                <meta name="description" content="Manage and access your downloads on audivo.in">
                <meta name="theme-color" content="#000000">

                <meta property="og:site_name" content="audivo">
                <meta property="og:title" content="audivo.in | Downloads">
                <meta property="og:description" content="Manage and access your downloads on audivo.in">
                <meta property="og:type" content="website">
                <meta property="og:url" content="${pageUrl}">

                <meta name="twitter:card" content="summary">
                <meta name="twitter:title" content="audivo.in | Downloads">
                <meta name="twitter:description" content="Manage and access your downloads on audivo.in">
            </head>
            <body>
                <h1>audivo.in | Downloads</h1>
                <p>Manage and access your downloads on audivo.in</p>
            </body>
            </html>
        `;

        return new Response(metaHtml, {
            headers: { 'content-type': 'text/html;charset=UTF-8' },
        });
    }

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
