var config = require('./config/config_server');
var logger = require('./logger');

// external libraries
var express = require('express');
var moment = require('moment');
var io = require('socket.io');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');

var app = express();

// set socket.io properties
io = io.listen(app.listen(config.port), {
  // configure s.io to use winston for logging
  'logger': logger,
});

// set express properties
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
app.use(cookieParser());
app.use(session({secret: config.sessionSecret, key: config.sessionKey}));
app.use(passport.initialize());
app.use(passport.session());

// our helpers
require('./config/passport')(passport);
var routes = require('./routes')(app, passport);
var sockets = require('./sockets')(io, passport);

// server started, display info
logger.info('server started at ' + moment().format('YYYY-MM-DD HH:MM:SS'));
logger.info('logging to console at level: ' + config.consoleLogLevel);
logger.info('logging to ' + config.logFile + ' at level: ' + config.fileLogLevel);
logger.info('application listening on port ' + config.port);
