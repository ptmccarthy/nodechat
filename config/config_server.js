var config = {}

// general settings
config.port = '8000';
config.mongoURL = 'localhost:27017/chat_db';
config.logLevel = 2; // 0 - error, 1 - warn, 2 - info, 3 - debug

// application settings
config.displayRecent = 10;

// export config
module.exports = config;
