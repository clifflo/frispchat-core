import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome to FrispChat
        </h1>
        <p className="max-w-sm text-lg text-zinc-500 dark:text-zinc-400">
          A simple, fast chat app. Create an account to get started.
        </p>
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition-colors"
          >
            Sign Up
          </Link>
          <Link
            href="/chat"
            className="rounded-full border border-zinc-300 dark:border-zinc-700 px-6 py-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Go to Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
