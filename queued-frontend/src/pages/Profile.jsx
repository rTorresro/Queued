import { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import API_BASE_URL from '../config';

export default function Profile() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      setError('');
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE_URL}/watchlist`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || 'Failed to load stats');
          return;
        }

        setItems(data || []);
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [token]);

  const stats = useMemo(() => {
    const total = items.length;
    const watched = items.filter((item) => item.is_watched).length;
    const rated = items.filter((item) => item.rating !== null).length;
    const avgRating = rated
      ? (
          items.reduce((sum, item) => sum + (item.rating || 0), 0) / rated
        ).toFixed(1)
      : '—';

    const topRated = [...items]
      .filter((item) => item.rating !== null)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    // Ratings distribution: buckets for 1–5 stars (maps to 2,4,6,8,10)
    const distribution = [2, 4, 6, 8, 10].map((score) => ({
      label: `${score / 2}★`,
      score,
      count: items.filter((item) => item.rating === score).length
    }));

    const maxCount = Math.max(...distribution.map((d) => d.count), 1);

    return { total, watched, rated, avgRating, topRated, distribution, maxCount };
  }, [items]);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 reveal">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-10 shadow-2xl reveal">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300/80">
          Your stats
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-100">Profile</h1>
        <p className="mt-2 text-sm text-slate-400">
          Track your watchlist progress and ratings over time.
        </p>

        {loading && <p className="mt-6 text-sm text-slate-400">Loading...</p>}
        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            {/* Stat cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total in watchlist', value: stats.total, color: 'text-slate-100' },
                { label: 'Watched', value: stats.watched, color: 'text-emerald-400' },
                { label: 'Rated', value: stats.rated, color: 'text-yellow-400' },
                { label: 'Average rating', value: stats.avgRating, color: 'text-red-400' }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className={`mt-3 text-3xl font-semibold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Ratings distribution chart */}
            {stats.rated > 0 && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-base font-semibold text-slate-100">Ratings distribution</h2>
                <p className="mt-1 text-xs text-slate-500">How you've rated your watched movies</p>
                <div className="mt-6 flex items-end gap-3">
                  {stats.distribution.map((bucket) => {
                    const heightPct = bucket.count
                      ? Math.max(8, Math.round((bucket.count / stats.maxCount) * 100))
                      : 4;
                    return (
                      <div key={bucket.score} className="flex flex-1 flex-col items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {bucket.count || ''}
                        </span>
                        <div className="relative w-full overflow-hidden rounded-t-lg bg-slate-800" style={{ height: 80 }}>
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-gradient-to-t from-yellow-500/80 to-yellow-400/50 transition-all duration-700"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{bucket.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top rated */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-base font-semibold text-slate-100">Top rated</h2>
              <div className="mt-4 space-y-3">
                {stats.topRated.length === 0 && (
                  <p className="text-sm text-slate-400">No ratings yet.</p>
                )}
                {stats.topRated.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-600">
                      #{index + 1}
                    </span>
                    {item.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                        alt={item.title}
                        className="h-10 w-7 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-7 rounded bg-slate-800" />
                    )}
                    <p className="flex-1 text-sm text-slate-200">{item.title}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= Math.round((item.rating || 0) / 2)
                              ? 'text-yellow-400'
                              : 'text-slate-700'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="ml-2 text-xs text-slate-400">{item.rating}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Watch progress */}
            {stats.total > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Overall watch progress</span>
                  <span className="font-semibold text-emerald-400">
                    {stats.total ? Math.round((stats.watched / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500/80 transition-all duration-700"
                    style={{
                      width: `${stats.total ? Math.round((stats.watched / stats.total) * 100) : 0}%`
                    }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-600">
                  {stats.watched} of {stats.total} watched
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
