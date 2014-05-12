var config = require('./config/config_server');
var logger = require('./logger');

// external libraries
var express = require('express');
var moment = require('moment');
var io = require('socket.io');
var bodyParser = require('body-parser');

// our helpers
var routes = require('./routes');
var sockets = require('./sockets');

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

// express routes
app.get('/', routes.index);
app.get('/signup', routes.signup);
app.get('/users', routes.users);

app.post('/signup', routes.newUser);

// initialize all of our socket listeners
sockets.init(io);

// server started, display info
logger.info('server started at ' + moment().format('YYYY-MM-DD HH:MM:SS'));
logger.info('logging to console at level: ' + config.consoleLogLevel);
logger.info('logging to ' + config.logFile + ' at level: ' + config.fileLogLevel);
logger.info('application listening on port ' + config.port);
