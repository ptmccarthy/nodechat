var config = {}

// general settings
config.port = '8000';
config.databaseName = 'chat-db';
config.mongoURL = 'localhost:27017/' + config.databaseName;

// logging settings
// for lvels use standard syslog severity levels
config.consoleLogLevel = 'info'
config.fileLogLevel = 'debug'
config.logFile = './logs/ddapp.log'
config.maxLogFileSize = 4194304 // bytes

// application settings
config.displayRecent = 10;

// connect sessions configuration
config.sessionSecret = 'D&DSessionSecret';
config.sessionKey = 'D&DSessionKey';

// export config
module.exports = config;
