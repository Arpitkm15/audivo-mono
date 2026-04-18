export async function onRequest(context) {
    const { request } = context;
    const pageUrl = request.url;

    const metaHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>audivo.in | Premium Support</title>
            <meta name="description" content="Support audivo.in while keeping the full experience free for everyone.">
            <meta name="theme-color" content="#000000">
            <meta property="og:site_name" content="audivo">
            <meta property="og:title" content="audivo.in | Premium Support">
            <meta property="og:description" content="Support audivo.in while keeping the full experience free for everyone.">
            <meta property="og:type" content="website">
            <meta property="og:url" content="${pageUrl}">
            <meta name="twitter:card" content="summary">
            <meta name="twitter:title" content="audivo.in | Premium Support">
            <meta name="twitter:description" content="Support audivo.in while keeping the full experience free for everyone.">
        </head>
        <body></body>
        </html>
    `;

    return new Response(metaHtml, {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
}