import { SessionOptions } from "iron-session";

export interface SessionData {
  userId: string;
  accessToken: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: "nolio_session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};
