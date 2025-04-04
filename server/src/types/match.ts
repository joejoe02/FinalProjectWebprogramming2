import { Participant } from "./participant";

export interface Match {
  matchId: string;
  participants: Participant[];
  winner?: Participant;
  isOngoing: boolean;
}
