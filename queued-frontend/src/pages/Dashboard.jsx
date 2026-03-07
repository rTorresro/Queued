import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <section id="dashboard" className="mx-auto w-full max-w-6xl px-6 py-12 reveal">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-10 shadow-2xl reveal">
        <h1 className="text-3xl font-semibold text-slate-100">Dashboard</h1>
        <p className="mt-3 text-sm text-slate-400">
          Jump back into your queue or keep searching for new picks.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/search"
            className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Search movies
          </Link>
          <Link
            to="/watchlist"
            className="rounded-full border border-white/10 bg-slate-900/70 px-6 py-2 text-sm font-semibold text-slate-100 transition hover:border-red-500/40 hover:text-red-200"
          >
            View watchlist
          </Link>
        </div>
      </div>
    </section>
  );
}