## A platform for managing and tracking a table-top game.

Note: this application is still in the very early stages of development and is not ready for real usage yet.

### Vision

Table-top games, such as D&D, are ultimately a collaborative story-telling activity led by a DM. There is unfortunately a lot of manual overhead for these games, such as tracking character sheets (stats, items, quests, etc.), rolling dice for calculating hits, misses, saving throws, etc., lack of easy private player communication, and many other chores with a real element of human error and fallability.

A web-based, multi-user platform for running a table-top game could potentially help alleviate much of this overhead and also allow for new complexities and intracacies by managing this overhead for the players and the DM alike.

Imagine a game engine along the lines of Baldur's Gate or Neverwinter Nights, but where the game and story play out on the table in front of you and the computer only acts as a management system.

### Installation instructions:

1. install mongodb, e.g. on OS X using Homebrew `brew install mongodb`

2. clone repository to local machine

3. `cd [repository]`

4. `npm install`

5. `mongod --dbpath [repository]/data/db`

6. `node server.js`
