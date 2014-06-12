// Instructions:
//
// With mongod service running, run this command in your shell:
//    mongo < reset_db.js
//

use chat-db
db.dropDatabase();
quit();

