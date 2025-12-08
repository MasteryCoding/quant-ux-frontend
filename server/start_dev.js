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

// Debug: Log all environment variables at startup
console.log('=== Environment Variables Debug ===');
console.log('QUX_HTTP_PORT:', process.env.QUX_HTTP_PORT);
console.log('QUX_PROXY_URL:', process.env.QUX_PROXY_URL);
console.log('QUX_SHARED_LIBS:', process.env.QUX_SHARED_LIBS);
console.log('QUX_USER_ALLOWED_DOMAINS:', process.env.QUX_USER_ALLOWED_DOMAINS);
console.log('QUX_MC_CLASSROOM_URL:', process.env.QUX_MC_CLASSROOM_URL);
console.log('classroomUrl (resolved):', classroomUrl);
console.log('===================================');

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
  const config = {
    auth: auth,
    sharedLibs: sharedLibs,
    user: {
      allowedDomains: userAllowedDomains
    },
    classroomUrl: classroomUrl || null
  };
  console.log('Serving config.json:', JSON.stringify(config, null, 2));
  res.send(config);
});

/**
 * init proxy.
 */
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

/**
 * Setup static to serve all html, js and images from server/dist
 */
app.use(express.static(assetsRoot));

/**
 * Create the server
 */
var server = http.createServer(app);

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please choose a different port.`);
  }
  process.exit(1);
});

// Finish application create.
console.log(`Starting server on port ${port}...`);
module.exports = server.listen(port, function () {
  console.debug(' ______     __  __     ______     __   __     ______   __  __     __  __');
  console.debug('/\\  __ \\   /\\ \\/\\ \\   /\\  __ \\   /\\ "-.\\ \\   /\\__  _\\ /\\ \\/\\ \\   /\\_\\_\\_\\ ');
  console.debug(
    '\\ \\ \\/\\_\\  \\ \\ \\_\\ \\  \\ \\  __ \\  \\ \\ \\-.  \\  \\/_/\\ \\/ \\ \\ \\_\\ \\  \\/_/\\_\\/_'
  );
  console.debug(
    ' \\ \\___\\_\\  \\ \\_____\\  \\ \\_\\ \\_\\  \\ \\_\\\\"\\_\\    \\ \\_\\  \\ \\_____\\   /\\_\\/\\_\\ '
  );
  console.debug('  \\/___/_/   \\/_____/   \\/_/\\/_/   \\/_/ \\/_/     \\/_/   \\/_____/   \\/_/\\/_/ ');
  console.log('Listening on ' + server.address().address + ':' + server.address().port);
  console.log('Backend   : ' + proxyUrl);
  console.log('Domains   : ' + userAllowedDomains);
  if (classroomUrl) {
    console.log('Classroom : ' + classroomUrl);
  }
  console.log('DEVELOPMENT MODE');
});
