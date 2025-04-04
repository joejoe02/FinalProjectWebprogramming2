import { Participant } from "./participant";

export interface GameMatch {
  participants: Participant[];
  isOngoing: boolean;
  winner?: string;
}
