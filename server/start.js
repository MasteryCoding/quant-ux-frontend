const http = require('http');
const express = require('express');
const path = require('path');
const compression = require('compression');
const proxyMiddleware = require('http-proxy-middleware');

/**
 * Some config stuff
 */
const assetsRoot = path.resolve(__dirname, '../dist');
const port = process.env.QUX_HTTP_PORT * 1 || 9000;
const proxyUrl = process.env.QUX_PROXY_URL;
const auth = 'qux';
const sharedLibs = process.env.QUX_SHARED_LIBS || '';
const userAllowedDomains = process.env.QUX_USER_ALLOWED_DOMAINS || '*';
const classroomUrl = process.env.QUX_MC_CLASSROOM_URL;

/**
 *
 * Init express
 */
var app = express();

/**
 * Add compression
 */
app.use(compression());

/**
 * make config dynamic on env variables
 */
app.get('/config.json', (_req, res) => {
  res.send({
    auth: auth,
    sharedLibs: sharedLibs,
    user: {
      allowedDomains: userAllowedDomains
    },
    classroomUrl: classroomUrl
  });
});

/**
 * init proxy.
 */
if (proxyUrl) {
  app.use(
    '/rest/',
    proxyMiddleware.createProxyMiddleware({
      target: proxyUrl,
      changeOrigin: true,
      // For Kubernetes internal services, increase timeout to handle potential DNS resolution delays
      timeout: 30000, // 30 seconds
      // Log proxy errors for debugging
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Proxy error', message: err.message });
        }
      },
      // Handle connection errors gracefully
      onProxyReq: (proxyReq) => {
        // Set longer timeout for internal service connections
        proxyReq.setTimeout(30000);
      }
    })
  );
} else {
  console.warn('WARNING: QUX_PROXY_URL not set. Proxy middleware not initialized.');
  // Return 503 for /rest/ requests if proxy is not configured
  app.use('/rest/', (_req, res) => {
    res.status(503).json({ error: 'Backend proxy not configured. QUX_PROXY_URL environment variable is required.' });
  });
}

/**
 * Setup static to serve all html, js and images from server/dist
 */
app.use(express.static(assetsRoot));

/**
 * Create the server
 */
var server = http.createServer(app);

// Finish application create.
module.exports = server.listen(port, function (err) {
  if (err) {
    console.log(err);
    return;
  }
  console.debug(' ______     __  __     ______     __   __     ______   __  __     __  __');
  console.debug('/\\  __ \\   /\\ \\/\\ \\   /\\  __ \\   /\\ "-.\\ \\   /\\__  _\\ /\\ \\/\\ \\   /\\_\\_\\_\\ ');
  console.debug(
    '\\ \\ \\/\\_\\  \\ \\ \\_\\ \\  \\ \\  __ \\  \\ \\ \\-.  \\  \\/_/\\ \\/ \\ \\ \\_\\ \\  \\/_/\\_\\/_'
  );
  console.debug(
    ' \\ \\___\\_\\  \\ \\_____\\  \\ \\_\\ \\_\\  \\ \\_\\\\"\\_\\    \\ \\_\\  \\ \\_____\\   /\\_\\/\\_\\ '
  );
  console.debug('  \\/___/_/   \\/_____/   \\/_/\\/_/   \\/_/ \\/_/     \\/_/   \\/_____/   \\/_/\\/_/ ');
  console.log('Backend   : ' + proxyUrl);
  console.log('Auth      : ' + auth);
  console.log('Domains   : ' + userAllowedDomains);
  if (classroomUrl) {
    console.log('Classroom : ' + classroomUrl);
  }
  console.log('PRODUCTION MODE');

  // Test backend connectivity if proxy is configured
  if (proxyUrl) {
    try {
      const parsedUrl = new URL(proxyUrl);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: '/health',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        console.log('Backend connectivity: OK (status ' + res.statusCode + ')');
      });

      req.on('error', (err) => {
        console.warn('Backend connectivity: WARNING - Could not reach backend at ' + proxyUrl);
        console.warn('  Error: ' + err.message);
        console.warn('  This may be normal if the backend is not yet ready or uses a different health endpoint');
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn('Backend connectivity: WARNING - Timeout connecting to backend');
      });

      req.end();
    } catch (err) {
      console.warn('Backend connectivity: Could not parse proxy URL: ' + err.message);
    }
  }
});
