import { Socket } from "socket.io";
import { ClientToServerEvents } from "./client-to-server-events";
import { ServerToClientEvents } from "./server-to-client-events";
import { SocketData } from "./socket-data";

export interface CustomSocket
  extends Socket<ClientToServerEvents, ServerToClientEvents> {
  data: SocketData;
}
