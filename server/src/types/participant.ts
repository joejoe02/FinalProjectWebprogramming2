import { Symbol } from "./symbol";
import { Session } from "./session";

export interface Participant extends Session {
  symbol: Symbol;
}
