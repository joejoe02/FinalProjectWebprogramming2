import { Symbol } from "./symbol";

export interface ClientToServerEvents {
  users: () => void;
  matches: () => void;
  game_challenge: (toUserId: string) => void;
  game_challenge_accepted: (matchId: string, toUserId: string) => void;
  game_challenge_declined: (toUserId: string) => void;
  ready: (matchId: string) => void;
  game_move: (
    matchId: string,
    symbol: Symbol,
    idx: number,
    isGameWinningMove: boolean,
    isDraw: boolean
  ) => void;
  leave: () => void;
}
