# General information
The server is written in NodeJS, which must be installed on the machine before running the server code. It can be downloaded [here](https://nodejs.org/en/).

Also all dependencies must be setup before running the server:
`npm install`

In order to run the server (which will run the server in a watch mode): `npm start`

The server is running on port **8080**. The server expects the client to run on port **3000** but that can be changed in `src/index.ts`

# Event listeners
Below is a listing of all the event listeners setup on the server as well as a basic example how to active the listeners:

**'users'**
This event should be emitted when you want to get the initial user list. 
*Parameters:* No parameters.
*Example:*
```js
socket.emit('users');
```

**'matches'**
This event should be emitted when you want to get the initial matches list. 
*Parameters:* No parameters.
*Example:*
```js
socket.emit('matches');
```

**'game_challenge'**
This event should be emitted when a user wants to challenge another user to a game of Tic-Tac-Toe.
*Parameters:* The user id of the user being challenged
*Example:*
```js
// Will challenge user with id 1
socket.emit('game_challenge', 1); 
```

**'game_challenge_accepted'**
This event should be emitted when a user wants to accept the challenge to a game of Tic-Tac-Toe
*Parameters:* The id of the match (guid) and user id of the challenger (number)
*Example:*
```js
socket.emit('game_challenge_accepted', 'd198e4e0-9d8b-4ee4-a6b6-c9591682495a', 2);
```

**'game_challenge_declined'**
This event should be emitted when a user wants to decline the challenge to a game of Tic-Tac-Toe
*Parameters:* user id of the challenger (number)
*Example:*
```js
// Sends a decline to user with id 2
socket.emit('game_challenge_declined', 2);
```

**'ready'**
This event should be emitted when a player enters the match room to notify that he is ready to play the game and receive his symbol to play
*Parameters:* Id of the match (guid)
*Example:*
```js
socket.emit('ready', 'd198e4e0-9d8b-4ee4-a6b6-c9591682495a');
```

**'game_move'**
This event should be emitted when a player has done his move to notify the other player of what move he made.
*Parameters:* Id of the match (guid), symbol (string), index (number), isGameWinningMove (boolean), isDraw (boolean)
*Example:*
```js
socket.emit('game_move', 'd198e4e0-9d8b-4ee4-a6b6-c9591682495a', 'X', 0, false, false);
```

**'leave'**
This event should be emitted when a player decides to leave
*Parameters:* No parameters.
*Example:*
```js
socket.emit('leave');
```

# Emitting events
Below is a listing of all the events which are emitted from the server, the clients connected via **socket.io** can add listeners on their side which are activated on emission:

**'users'**
This event is emitted from the server and contains a list of users
```js
socket.on('users', users => {
  // Do something with the users list
});
```

**'matches'**
This event is emitted from the server and contains a list of matches
```js
socket.on('matches', matches => {
  // Do something with the matches list
});
```

**'new_match'**
This event is emitted from the server when a new match has been created
```js
socket.on('new_match', match => {
  // Do something with the match
});
```

**'match_ended'**
This event is emitted from the server when a match has ended, if the winner is undefined / null the match ended in a draw
```js
socket.on('match_ended', (matchId, winner) => {
  // Do something with the match information
});
```

**'game_challenge'**
This event is emitted from the server to the socket being challenged.
```js
socket.on('game_challenge', gameChallengeObject => {
  // Do something with the game challenge object
});
```

**'game_challenge_accepted'**
This event is emitted from the server to the socket which initially challenged notifying that his request was accepted.
```js
socket.on('game_challenge_accepted', (matchId, fromUser) => {
  // Do something with the information
});
```

**'game_challenge_declined'**
This event is emitted from the server to the socket which initially challenged notifying that his request was declined.
```js
socket.on('game_challenge_declined', fromUser => {
  // Do something with the information
});
```

**'assign_symbol'**
This event is emitted from the server to the socket which send the 'ready' event and contains information about the symbol the player should play.
```js
socket.on('assign_symbol', symbol => {
  // Do something with the information
});
```

**'game_move'**
This event is emitted from the server to both sockets which are part of the match, notifying them that a move has been made.
```js
socket.on('game_move', (symbol, idx) => {
  // Do something with the information
});
```

**'connected_user'**
This event is emitted from the server when a new player connects and all connected sockets are notified by this.
```js
socket.on('connected_user', userObject => {
  // Do something with the information
});
```

**'disconnected_user'**
This event is emitted from the server when a player disconnects and all connected sockets are notified by this.
```js
socket.on('disconnected_user', userId => {
  // Do something with the information
});
```

**'session'**
This event is emitted from the server to the socket which just connected and contains information to reconnect using a session id. This should be stored within a local storage.
```js
socket.on('session', session => {
  // Do something with the information
});
```