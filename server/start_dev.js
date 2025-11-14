const http = require('http');
const express = require('express');
const path = require('path');
const compression = require('compression');
const proxyMiddleware = require('http-proxy-middleware');

/**
 * Some config stuff
 */
const host = process.env.QUX_HTTP_HOST || '0.0.0.0';
const assetsRoot = path.resolve(__dirname, '../dist');
const port = process.env.QUX_HTTP_PORT * 1 || 8090;
const proxyUrl = process.env.QUX_PROXY_URL;
const auth = 'qux';
const tos = process.env.QUX_TOS_URL || '';
const sharedLibs = process.env.QUX_SHARED_LIBS || '';
const userAllowSignUp = process.env.QUX_USER_ALLOW_SIGNUP !== 'false';
const userAllowedDomains = process.env.QUX_USER_ALLOWED_DOMAINS || '*';

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
    tos: tos,
    sharedLibs: sharedLibs,
    user: {
      allowSignUp: userAllowSignUp,
      allowedDomains: userAllowedDomains
    }
  });
});

/**
 * init proxy.
 */
app.use(
  '/rest/',
  proxyMiddleware.createProxyMiddleware({
    target: proxyUrl,
    changeOrigin: true
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
  console.log('Listening on ' + host + ':' + server.address().port);
  console.log('Backend   : ' + proxyUrl);
  console.log('Auth      : ' + auth);
  console.log('SignUp    : ' + userAllowSignUp);
  console.log('Domains   : ' + userAllowedDomains);
  console.log('DEVELOPMENT MODE');
});
