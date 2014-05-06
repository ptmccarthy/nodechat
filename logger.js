var config = require('./config/config_server')

// external libraries
var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: config.consoleLogLevel,
      colorize: true
    }),
    new (winston.transports.File)({ 
      level: config.fileLogLevel,
      filename: config.logFile
    })
  ]

});

module.exports = logger;
