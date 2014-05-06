var config = {}

// general settings
config.port = '8000';
config.mongoURL = 'localhost:27017/chat_db';

// logging settings
// for lvels use standard syslog severity levels
config.consoleLogLevel = 'info'
config.fileLogLevel = 'debug'
config.logFile = './logs/ddapp.log'
config.maxLogFileSize = 4194304 // bytes

// application settings
config.displayRecent = 10;

// export config
module.exports = config;
