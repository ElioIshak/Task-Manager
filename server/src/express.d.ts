import type { UserJWT } from "./types";

declare global {
    namespace Express {
        interface Request {
            userJWT?: UserJWT;
        }
    }
}

export {};
