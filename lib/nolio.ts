const BASE_URL = "https://www.nolio.io/api";

function clientId() { return process.env.NOLIO_CLIENT_ID!; }
function clientSecret() { return process.env.NOLIO_CLIENT_SECRET!; }
function redirectUri() { return process.env.NOLIO_REDIRECT_URI!; }

export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    redirect_uri: redirectUri(),
    state,
  });
  return `${BASE_URL}/authorize/?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64");
  const res = await fetch(`${BASE_URL}/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: string;
}> {
  const credentials = Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64");
  const res = await fetch(`${BASE_URL}/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (res.status === 400) throw new Error("refresh_token invalid or revoked");
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json();
}

export async function getNolioUser(accessToken: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/get/user/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch user: ${await res.text()}`);
  return res.json();
}

export async function getAthletes(accessToken: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${BASE_URL}/get/athletes/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch athletes: ${await res.text()}`);
  return res.json();
}

export async function getTrainings(
  accessToken: string,
  athleteId: number,
  from: string,
  to: string
): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({ athlete_id: String(athleteId), from, to, limit: "300" });
  const res = await fetch(`${BASE_URL}/get/training/?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch trainings: ${await res.text()}`);
  return res.json();
}

export async function createPlannedTraining(
  accessToken: string,
  body: {
    id_partner: number;
    sport_id: number;
    name: string;
    date_start: string;
    description?: string;
    duration?: number;
    rpe?: number;
    distance?: number;
    elevation_gain?: number;
    athlete_id?: number;
  }
): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/create/planned/training/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create planned training: ${await res.text()}`);
  return res.json();
}

export async function getPlannedTrainings(
  accessToken: string,
  athleteId: number,
  from: string,
  to: string
): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({ athlete_id: String(athleteId), from, to, limit: "300" });
  const res = await fetch(`${BASE_URL}/get/planned/training/?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch planned trainings: ${await res.text()}`);
  return res.json();
}
