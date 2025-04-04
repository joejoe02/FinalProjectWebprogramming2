import { Match } from "./match";
import { Participant } from "./participant";
import { Session } from "./session";
import { Symbol } from "./symbol";

export interface ServerToClientEvents {
  session: (data: SessionData) => void;
  users: (users: Session[]) => void;
  matches: (matches: Match[]) => void;
  connected_user: (user: Session) => void;
  disconnected_user: (userId: string) => void;
  user_left: (userId: string) => void;
  game_challenge: (data: { challenger: Session }) => void;
  game_challenge_accepted: (matchId: string, challenger: Session) => void;
  game_challenge_declined: (challenger: Session) => void;
  assign_symbol: (symbol: Symbol) => void;
  game_move: (symbol: Symbol, idx: number) => void;
  match_ended: (matchId: string, winner: Participant | null) => void;
  new_match: (match: Match) => void;
}
