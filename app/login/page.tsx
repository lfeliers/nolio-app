export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-gray-100 gap-6">
      <h1 className="text-2xl font-bold">Nolio</h1>
      <p className="text-gray-400 text-sm">Connect your Nolio account to continue.</p>
      <a
        href="/api/auth/login"
        className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        Connect with Nolio
      </a>
    </div>
  );
}
