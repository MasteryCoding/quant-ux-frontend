var path = require('path');

// Log environment variables when module loads
console.log('=== vue.config.js loaded ===');
console.log('QUX_MC_CLASSROOM_URL at module load:', process.env.QUX_MC_CLASSROOM_URL);
console.log('All QUX_ env vars:', Object.keys(process.env).filter(k => k.startsWith('QUX_')).map(k => `${k}=${process.env[k]}`));
console.log('===========================');

// Build dynamic config from environment variables
function getConfig() {
  const config = {
    auth: 'qux',
    websocket: process.env.QUX_WEBSOCKET_URL || 'wss://ws.quant-ux.com',
    sharedLibs: process.env.QUX_SHARED_LIBS || '',
    user: {
      allowSignUp: process.env.QUX_ALLOW_SIGNUP !== 'false',
      allowedDomains: process.env.QUX_USER_ALLOWED_DOMAINS || '*'
    },
    classroomUrl: process.env.QUX_MC_CLASSROOM_URL || null,
    // Keycloak config if needed
    keycloak: process.env.QUX_KEYCLOAK_URL ? {
      realm: process.env.QUX_KEYCLOAK_REALM || 'qux',
      clientId: process.env.QUX_KEYCLOAK_CLIENT_ID || 'qux',
      url: process.env.QUX_KEYCLOAK_URL
    } : undefined
  };
  
  // Remove undefined values
  Object.keys(config).forEach(key => {
    if (config[key] === undefined) {
      delete config[key];
    }
  });
  
  // Debug logging
  console.log('=== Vue Config Environment Variables ===');
  console.log('QUX_SHARED_LIBS:', process.env.QUX_SHARED_LIBS);
  console.log('QUX_USER_ALLOWED_DOMAINS:', process.env.QUX_USER_ALLOWED_DOMAINS);
  console.log('QUX_MC_CLASSROOM_URL:', process.env.QUX_MC_CLASSROOM_URL);
  console.log('QUX_WEBSOCKET_URL:', process.env.QUX_WEBSOCKET_URL);
  console.log('Config being served:', JSON.stringify(config, null, 2));
  console.log('=======================================');
  
  return config;
}

module.exports = {
  devServer: {
    port: process.env.QUX_HTTP_PORT ? parseInt(process.env.QUX_HTTP_PORT) : 9000,
    host: '0.0.0.0',
    allowedHosts: [
      'qux.docker.localhost',
      'localhost',
      '.localhost' // Allows all .localhost subdomains
    ],
    // HMR configuration for Docker
    // Enable hot module replacement
    hot: true,
    // Client configuration for HMR WebSocket connection
    client: {
      // WebSocket URL - tell client where to connect for HMR
      // Use 'auto' to detect, or set QUX_DEV_HOSTNAME env var for Docker
      webSocketURL: process.env.QUX_DEV_HOSTNAME 
        ? {
            hostname: process.env.QUX_DEV_HOSTNAME,
            pathname: '/ws',
            port: process.env.QUX_HTTP_PORT ? parseInt(process.env.QUX_HTTP_PORT) : 9000,
            protocol: 'ws',
          }
        : 'auto',
      // Enable HMR overlay for errors
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    // Use 'onBeforeSetupMiddleware' for webpack-dev-server compatibility
    onBeforeSetupMiddleware: function(devServer) {
      console.log('Setting up /config.json route in onBeforeSetupMiddleware hook');
      // Serve dynamic config.json from environment variables
      devServer.app.get('/config.json', function(req, res) {
        console.log('[/config.json] Request received, serving dynamic config');
        console.log('Environment check - QUX_MC_CLASSROOM_URL:', process.env.QUX_MC_CLASSROOM_URL);
        const config = getConfig();
        console.log('Sending config:', JSON.stringify(config, null, 2));
        res.json(config);
      });
    },
    proxy: {
      '^/rest': {
        //target:  'http://localhost:8082',
        target: process.env.QUX_PROXY_URL,
        ws: true,
        changeOrigin: true
      },
    }
  },
  chainWebpack: config => {
    config.resolve.alias.set('src', path.resolve('src'))
    config.resolve.alias.set('assets', path.resolve('src/assets'))
    config.resolve.alias.set('components', path.resolve('src/components'))
    config.resolve.alias.set('dojo', path.resolve('src/dojo'))
    config.resolve.alias.set('common', path.resolve('src/common'))
    config.resolve.alias.set('vommond', path.resolve('src/vommond'))
    config.resolve.alias.set('views', path.resolve('src/views'))
    config.resolve.alias.set('canvas', path.resolve('src/canvas'))
    config.resolve.alias.set('page', path.resolve('src/page'))
    config.resolve.alias.set('user', path.resolve('src/user'))
    config.resolve.alias.set('core', path.resolve('src/core'))
    config.resolve.alias.set('dash', path.resolve('src/dash'))
    config.resolve.alias.set('public', path.resolve('src/public'))
    config.resolve.alias.set('services', path.resolve('src/services'))
    config.resolve.alias.set('nls', path.resolve('src/nls'))
    config.resolve.alias.set('themes', path.resolve('src/themes'))
    config.resolve.alias.set('export', path.resolve('src/export'))
    config.resolve.alias.set('examples', path.resolve('src/examples'))
    config.resolve.alias.set('help', path.resolve('src/help'))
    config.resolve.alias.set('player', path.resolve('src/player'))
    config.resolve.alias.set('style', path.resolve('src/style'))
  }
}