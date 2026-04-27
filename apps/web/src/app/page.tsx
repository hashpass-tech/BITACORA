export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-4 text-3xl font-bold">Bitacora</h1>
        <p className="mb-6 text-slate-600 dark:text-slate-400">
          Welcome to the web version of Bitacora
        </p>
        <div className="space-y-4">
          <button className="w-full rounded-md bg-blue-600 py-2 px-4 font-medium text-white hover:bg-blue-700 transition-colors">
            Get Started
          </button>
          <button className="w-full rounded-md border border-slate-200 bg-white py-2 px-4 font-medium text-slate-900 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
            Learn More
          </button>
        </div>
      </div>
    </main>
  );
}
