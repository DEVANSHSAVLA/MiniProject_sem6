/**
 * AI Chain Guard - Unified Master Gateway (FINAL FIX)
 * 
 * THE BUG: When using app.use('/api', proxy), Express STRIPS the /api
 * prefix before handing to the proxy. The proxy then sends /auth/login
 * to Flask, but Flask expects /api/auth/login. Flask 404s and returns HTML.
 *
 * THE FIX: Mount the proxy at '/' with a filter. This way Express does NOT
 * strip anything, and the full path /api/auth/login reaches Flask intact.
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 8000;

console.log('\n' + '='.repeat(60));
console.log('  AI CHAIN GUARD - MASTER GATEWAY (FINAL)');
console.log('='.repeat(60));



/**
 * 1. API PROXY — mounted at root with a filter
 * Express will NOT strip any prefix. The full URL passes through untouched.
 * /api/auth/login on :8000 → /api/auth/login on :5000 (PERFECT MATCH)
 */
const apiProxy = createProxyMiddleware({
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
    xfwd: true,
    onProxyReq: (proxyReq, req) => {
        console.log(`[API] ${req.method} ${req.originalUrl} → http://127.0.0.1:5000${req.originalUrl}`);
    },
    onError: (err, req, res) => {
        console.error(`[!] Backend connection failed: ${err.message}`);
        res.status(502).json({ error: 'Backend is offline', details: err.message });
    }
});

// Use a filter: only proxy requests that start with /api
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return apiProxy(req, res, next);
    }
    next();
});

/**
 * 2. BLOCKCHAIN PROXY
 */
app.use('/rpc', createProxyMiddleware({
    target: 'http://127.0.0.1:7545',
    changeOrigin: true,
    pathRewrite: { '^/rpc': '' },
    onError: (err, req, res) => {
        res.status(502).json({ error: 'Blockchain is offline' });
    }
}));

/**
 * 3. STATIC FILES + SPA FALLBACK
 */
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n[OK] Gateway is LIVE on http://localhost:${PORT}`);
    console.log(`[OK] API proxy: localhost:${PORT}/api/* → 127.0.0.1:5000/api/*`);
    console.log('='.repeat(60) + '\n');
});
