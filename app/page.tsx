import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { getAnyUser } from "@/lib/db";

export default async function Home() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const user = session.userId ? await getAnyUser() : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Nolio App</h1>

      {user ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-green-500 font-medium">
            ✓ Connected as {String(user.profile.email ?? user.profile.username ?? user._id)}
          </p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Disconnect
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400">No Nolio account linked.</p>
          <a
            href="/api/auth/login"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Connect Nolio
          </a>
        </div>
      )}
    </main>
  );
}
