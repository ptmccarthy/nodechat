var config = require('./config/config_server');
var logger = require('./logger');

// external libraries
var express = require('express');
var moment = require('moment');
var io = require('socket.io');
var mongoose = require('mongoose')

// express middleware
var passport = require('passport');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');

// session store
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var sessionStore = new MongoStore({ db: config.databaseName });

var app = express();

mongoose.connect(config.mongoURL, function(err) {
  if (err) {
    logger.error('Failed to connect to mongodb');
    throw err;
  } else {
    logger.info('Connected to mongodb at ' + config.mongoURL);
  }
});

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
app.use(session({
  secret: config.sessionSecret,
  key: config.sessionKey,
  store: sessionStore
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// our helpers
var passportConfig = require('./config/passport')(passport);
var routes = require('./routes')(app, passport);
var sockets = require('./sockets').init(io, passport, sessionStore);

// server started, display info
logger.info('server started at ' + moment().format('YYYY-MM-DD HH:MM:SS'));
logger.info('logging to console at level: ' + config.consoleLogLevel);
logger.info('logging to ' + config.logFile + ' at level: ' + config.fileLogLevel);
logger.info('application listening on port ' + config.port);
