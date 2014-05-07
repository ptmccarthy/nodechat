var config = require('./config/config_server');
var fs = require('fs');

// external libraries
var winston = require('winston');

if (!fs.existsSync('./logs')) { 
  fs.mkdirSync('./logs')
}

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
