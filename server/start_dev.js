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
  console.log('Listening on ' + server.address().address + ':' + server.address().port);
  console.log('Backend   : ' + proxyUrl);
  console.log('Domains   : ' + userAllowedDomains);
  if (classroomUrl) {
    console.log('Classroom : ' + classroomUrl);
  }
  console.log('DEVELOPMENT MODE');
});
