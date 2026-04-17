export async function onRequest(context) {
    const { request } = context;
    const pageUrl = request.url;

    const metaHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>audivo.in | Donate</title>
            <meta name="description" content="A minimalist music streaming application">
            <meta name="theme-color" content="#000000">

            <meta property="og:site_name" content="audivo">
            <meta property="og:title" content="audivo.in | Donate">
            <meta property="og:description" content="A minimalist music streaming application">
            <meta property="og:type" content="website">
            <meta property="og:url" content="${pageUrl}">

            <meta name="twitter:card" content="summary">
            <meta name="twitter:title" content="audivo.in | Donate">
            <meta name="twitter:description" content="A minimalist music streaming application">
        </head>
        <body>
            <h1>audivo.in | Donate</h1>
            <p>A minimalist music streaming application</p>
        </body>
        </html>
    `;

    return new Response(metaHtml, {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
}
