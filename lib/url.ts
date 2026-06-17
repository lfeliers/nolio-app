export function appUrl(): string {
  return process.env.NOLIO_REDIRECT_URI!.replace("/api/auth/callback", "");
}
