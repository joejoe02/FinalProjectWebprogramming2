import { randomBytes } from "crypto";

export const getRandomId = (): string => randomBytes(16).toString("hex");
