/**
 * This file sets up the http proxy middleware for the development environment.
 *
 * This simulates the UI, API and auth all being on the same domain, as in production.
 */

const { createProxyMiddleware } = require('http-proxy-middleware');


// Use an environment variable to determine the backend server
// Defaults to a local backend
const backendUrl = process.env.PROXY_BACKEND_URL || 'http://localhost:8000';


const proxy = createProxyMiddleware(
    // Proxy the prefixes used by the Django backend
    ['/admin', '/api', '/assets', '/auth', '/__debug__'],
    {
        target: backendUrl,
        changeOrigin: true,
        // Make sure to add x-forward headers
        xfwd: true,
        // Rewrite the response to replace instances of the backend URL with the dev server URL
        // This allows the UI to use the links as-is without needing CORS
        selfHandleResponse: true,
        onProxyRes: (proxyRes, req, res) => {
            // Gather the chunks of the body from the pieces of the proxy response
            let bodyChunks = [];
            proxyRes.on('data', data => { bodyChunks.push(data); });
            // Once the proxy response has ended, make our mods and write the downstream response
            proxyRes.on('end', () => {
                // Get the full body as bytes
                const bodyBytes = Buffer.concat(bodyChunks);
                // Forward the status and headers
                res.status(proxyRes.statusCode);
                // Make sure to exclude the content-length header as it may change
                Object.entries(proxyRes.headers)
                    .filter(([name, _]) => name.toLowerCase() !== "content-length")
                    .forEach(header => { res.append(...header); });
                // Make the required modifications to the response body
                if( bodyBytes.length ) {
                    const bodyString = bodyBytes.toString();
                    const newBodyString = bodyString.replaceAll(backendUrl, 'http://localhost:3000');
                    const newBodyBytes = Buffer.from(newBodyString);
                    // Set a new content-length header before sending the body
                    res.set('content-length', newBodyBytes.length);
                    res.send(newBodyBytes);
                }
                res.end();
            });
        }
    }
);


module.exports = function(app) {
    app.use(proxy);
};
