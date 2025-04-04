import { createServer } from "http";
import { RemoteSocket, Server, Socket } from "socket.io";
import { InMemorySessionStore } from "./stores/session-store";
import { getRandomId } from "./utils/random";
import { ClientToServerEvents } from "./types/client-to-server-events";
import { Match } from "./types/match";
import { Matches } from "./types/matches";
import { Participant } from "./types/participant";
import { Symbol } from "./types/symbol";
import { ServerToClientEvents } from "./types/server-to-client-events";
import { SocketData } from "./types/socket-data";
import { Session } from "./types/session";
import { CustomSocket } from "./types/custom-socket";

const httpServer = createServer();

const sessionStore = new InMemorySessionStore();

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const matches: Matches = {};
const availableSymbols: Symbol[] = [Symbol.X, Symbol.O];

io.use((socket: CustomSocket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    const session = sessionStore.findSession(sessionID);
    if (session) {
      socket.data.sessionID = sessionID;
      socket.data.userID = session.userID;
      socket.data.username = session.username;
      return next();
    }
  }
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  if (sessionStore.isUsernameOccupied(username)) {
    return next(new Error("occupied"));
  }

  socket.data.sessionID = getRandomId();
  socket.data.userID = getRandomId();
  socket.data.username = username;
  next();
});

const getListOfUsers = (): Session[] => {
  const sessions = sessionStore.findAllSessions();
  const users: Session[] = [];

  sessions.forEach((session) => {
    users.push({
      userID: session.userID,
      username: session.username,
      connected: session.connected,
    });
  });
  return users;
};

const getListOfMatches = (): Match[] => {
  const matchList: Match[] = [];
  Object.keys(matches).forEach((matchId) => {
    const currentMatch = matches[matchId];
    const { isOngoing } = currentMatch;
    const participants = currentMatch.participants;
    const winner = participants.find((p) => p.userID === currentMatch.winner);
    matchList.push({
      matchId,
      participants,
      winner,
      isOngoing,
    });
  });
  return matchList;
};

const getSocketByUserId = async (
  userId: string
): Promise<CustomSocket | null> => {
  try {
    const sockets = await io.fetchSockets();
    const socket = sockets.find(
      (socket: RemoteSocket<ServerToClientEvents, SocketData>) =>
        socket.data.userID === userId
    );

    if (!socket) {
      return null;
    }

    const actualSocket = io.sockets.sockets.get(socket.id) as CustomSocket;
    return actualSocket || null;
  } catch (error) {
    console.error("Error fetching socket:", error);
    return null;
  }
};

const associateSocketWithMatch = (socket: CustomSocket): void => {
  Object.keys(matches).forEach((matchKey) => {
    const currentMatch = matches[matchKey];
    if (
      currentMatch.participants.find((p) => p.userID === socket.data.userID)
    ) {
      socket.join(matchKey);
    }
  });
};

io.on("connection", (socket: CustomSocket) => {
  // persist session
  sessionStore.saveSession(socket.data.sessionID, {
    userID: socket.data.userID,
    username: socket.data.username,
    connected: true,
  });

  // emit session details
  socket.emit("session", {
    sessionID: socket.data.sessionID,
    userID: socket.data.userID,
    username: socket.data.username,
  });

  socket.join(socket.data.userID);
  associateSocketWithMatch(socket);

  console.log(`Connected as ${socket.data.username}`);

  // Broadcast to all users the newly connected user
  socket.broadcast.emit("connected_user", {
    userID: socket.data.userID,
    username: socket.data.username,
    connected: true,
  });

  socket.on("users", () => {
    socket.emit("users", getListOfUsers());
  });

  socket.on("matches", () => {
    socket.emit("matches", getListOfMatches());
  });

  socket.on("game_challenge", (toUserId: string) => {
    const fromUser = sessionStore.findSession(socket.data.sessionID);
    socket.to(toUserId).emit("game_challenge", { challenger: fromUser! });
  });

  socket.on(
    "game_challenge_accepted",
    async (matchId: string, toUserId: string) => {
      const toSocket = await getSocketByUserId(toUserId);
      if (!toSocket) {
        console.log("Target socket not found");
        return;
      }

      toSocket.join(matchId);
      socket.join(matchId);

      const firstSymbol =
        availableSymbols[Math.floor(Math.random() * availableSymbols.length)];

      const fromUser = sessionStore.findSession(socket.data.sessionID);
      const toUser = sessionStore.findSession(toSocket.data.sessionID);

      if (!fromUser || !toUser) {
        console.log("User session not found");
        return;
      }

      const participants: Participant[] = [
        { ...toUser, symbol: firstSymbol },
        { ...fromUser, symbol: firstSymbol === Symbol.X ? Symbol.O : Symbol.X },
      ];

      matches[matchId] = {
        participants,
        isOngoing: true,
      };

      socket.to(toUserId).emit("game_challenge_accepted", matchId, fromUser);
      io.emit("new_match", {
        matchId,
        participants,
        winner: undefined,
        isOngoing: true,
      });
    }
  );

  socket.on("game_challenge_declined", (toUserId: string) => {
    const fromUser = sessionStore.findSession(socket.data.sessionID);
    socket.to(toUserId).emit("game_challenge_declined", fromUser!);
  });

  socket.on("ready", (matchId: string) => {
    const participant = matches[matchId]?.participants.find(
      (p) => p.userID === socket.data.userID
    );
    if (participant) {
      socket.emit("assign_symbol", participant.symbol);
    }
  });

  socket.on(
    "game_move",
    (
      matchId: string,
      symbol: Symbol,
      idx: number,
      isGameWinningMove: boolean,
      isDraw: boolean
    ) => {
      const match = matches[matchId];
      if (!match) {
        console.log(`Match ${matchId} not found`);
        return;
      }

      if (isDraw) {
        console.log(`Match ${matchId} ended with a draw.`);
        io.emit("match_ended", matchId, null);
        match.isOngoing = false;
      } else if (isGameWinningMove) {
        match.winner = socket.data.userID;
        match.isOngoing = false;
        const winner = match.participants.find(
          (p) => p.userID === socket.data.userID
        );
        if (winner) {
          console.log(
            `Match ${matchId} ended with a win for '${socket.data.username}'.`
          );
          io.emit("match_ended", matchId, winner);
        }
      }
      io.to(matchId).emit("game_move", symbol, idx);
    }
  );

  socket.on("leave", () => {
    sessionStore.removeSession(socket.data.sessionID);
    socket.broadcast.emit("user_left", socket.data.userID);
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.data.username}`);

    const session = sessionStore.findSession(socket.data.sessionID);

    if (session) {
      sessionStore.saveSession(socket.data.sessionID, {
        userID: socket.data.userID,
        username: socket.data.username,
        connected: false,
      });

      socket.broadcast.emit("disconnected_user", socket.data.userID);
    }
  });
});

httpServer.listen(8080);
