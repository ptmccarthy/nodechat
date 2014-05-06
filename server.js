var config = require('./config/config_server');

// external libraries
var express = require('express');
var moment = require('moment');
var io = require('socket.io');

// our helpers
var routes = require('./routes');
var sockets = require('./sockets');

var app = express();
var logger;

io = io.listen(app.listen(config.port));

// use socket.io's logger because its nice
io.set('log level', config.logLevel);
logger = io.log;

// set express properties
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));

// express routes
app.get('/', routes.index);

// initialize all of our socket listeners
sockets.init(io);

// server started, display info
logger.info('server started at ' + moment().format('YYYY-MM-DD HH:MM:SS'));
logger.info('logger set to level: ' + logger.level);
logger.info('application listening on port ' + config.port);
