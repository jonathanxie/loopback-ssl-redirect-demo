var loopback = require('loopback');
var boot = require('loopback-boot');

// Load the necessary modules and middleware for HTTPS
var http = require('http');
var https = require('https');
var httpsRedirect = require('./middleware/https-redirect');
var sslCert = require('./ssl/ssl-cert');
var httpsOptions = {
  key: sslCert.privateKey,
  cert: sslCert.certificate
};

// Load middleware for API Explorer
var explorer = require('./middleware/explorer');

// Get an app server instance from LoopBack
var app = module.exports = loopback();

// Set up the /favicon.ico
app.use(loopback.favicon());

// request pre-processing middleware
app.use(loopback.compress());

// -- Add your pre-processing middleware here --

// boot scripts mount components like REST API
boot(app, __dirname);

// Define HTTPS redirect first since order matters when defining middleware
var httpsPort = app.get('https-port');
app.use(httpsRedirect({httpsPort: httpsPort}));

// All middleware and routes defined below and on will be redirected to a HTTPS connection

// Set up API explorer
explorer(app);

// Set up route for `/` to show loopback status for now
app.get('/', loopback.status());

// -- Mount static files here--
// All static middleware should be registered at the end, as all requests
// passing the static middleware are hitting the file system
// Example:
//   var path = require('path');
//   app.use(loopback.static(path.resolve(__dirname, '../client')));

// Requests that get this far won't be handled
// by any middleware. Convert them into a 404 error
// that will be handled later down the chain.
app.use(loopback.urlNotFound());

// The ultimate error handler.
app.use(loopback.errorHandler());

app.start = function() {
  
  // start the web server
	var port = app.get('port');

  http.createServer(app).listen(port, function() {
    console.log('Web server listening at: %s', 'http://localhost:3000/');
    https.createServer(httpsOptions, app).listen(httpsPort, function() {
      app.emit('started');
      console.log('Web server listening at: %s', app.get('url'));
    });
  });

};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
