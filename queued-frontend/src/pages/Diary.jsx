import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getWatchlist } from '../services/watchlist';
import { TMDB_IMAGE_BASE } from '../utils/constants';

export default function Diary() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getWatchlist(token)
      .then((data) => setItems((data || []).filter((i) => i.is_watched)))
      .catch((err) => setError(err.message || 'Network error'))
      .finally(() => setLoading(false));
  }, [token]);

  const grouped = useMemo(() => {
    const groups = {};
    [...items]
      .sort((a, b) => new Date(b.watched_at || b.added_at) - new Date(a.watched_at || a.added_at))
      .forEach((item) => {
        const d = new Date(item.watched_at || item.added_at);
        const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
    return Object.entries(groups);
  }, [items]);

  const totalHours = Math.floor(
    items.filter((i) => i.runtime).reduce((s, i) => s + i.runtime, 0) / 60
  );

  return (
    <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12 reveal">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300/80">
            Your history
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-100">Watch Diary</h1>
          <p className="mt-2 text-sm text-slate-400">
            Every film you've watched, in order.
          </p>
          {!loading && items.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                {items.length} films watched
              </span>
              {totalHours > 0 && (
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                  {totalHours}h of cinema
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="h-16 w-11 shrink-0 rounded-lg bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded bg-slate-800" />
                <div className="h-2 w-1/4 rounded bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/70 p-10 text-center">
          <p className="text-slate-400">No watched movies yet.</p>
          <Link
            to="/watchlist"
            className="mt-4 inline-flex rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Go to Watchlist →
          </Link>
        </div>
      )}

      {!loading && !error && grouped.map(([month, monthItems]) => (
        <div key={month} className="mt-10 reveal">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              {month}
            </h2>
            <div className="h-px flex-1 bg-white/5" />
            <span className="shrink-0 text-xs text-slate-600">
              {monthItems.length} {monthItems.length === 1 ? 'film' : 'films'}
            </span>
          </div>

          <div className="space-y-2">
            {monthItems.map((item) => {
              const date = new Date(item.added_at);
              const day = date.toLocaleString('default', { month: 'short', day: 'numeric' });
              return (
                <Link
                  key={item.id}
                  to={`/movies/${item.tmdb_movie_id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-900/60 p-3 transition hover:border-red-500/20 hover:bg-slate-900/80"
                >
                  {item.poster_path ? (
                    <img
                      src={`${TMDB_IMAGE_BASE}/w92${item.poster_path}`}
                      alt={item.title}
                      className="h-16 w-11 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-11 shrink-0 rounded-lg bg-slate-800" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100 group-hover:text-red-300 transition">
                      {item.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {item.release_year && <span>{item.release_year}</span>}
                      {item.runtime && <span>{item.runtime} min</span>}
                      {item.director && <span>Dir. {item.director}</span>}
                    </div>
                    {item.notes && (
                      <p className="mt-1 text-xs italic text-slate-500 line-clamp-1">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-xs text-slate-600">{day}</span>
                    {item.rating !== null && (
                      <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs font-semibold text-yellow-400">
                        {item.rating}/10
                      </span>
                    )}
                    {item.mood && (
                      <span className="rounded-full border border-purple-500/20 bg-purple-600/10 px-2 py-0.5 text-xs text-purple-400">
                        {item.mood}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
