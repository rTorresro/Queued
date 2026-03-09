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
        const res = await fetch(`${API_BASE_URL}/watchlist`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) { setError(data?.error || 'Failed to load stats'); return; }
        setItems(data || []);
      } catch { setError('Network error'); }
      finally { setLoading(false); }
    };
    fetchWatchlist();
  }, [token]);

  const stats = useMemo(() => {
    const total = items.length;
    const watched = items.filter((i) => i.is_watched).length;
    const rated = items.filter((i) => i.rating !== null).length;
    const avgRating = rated
      ? (items.reduce((sum, i) => sum + (i.rating || 0), 0) / rated).toFixed(1)
      : '—';

    // Hours watched
    const totalMinutes = items
      .filter((i) => i.is_watched && i.runtime)
      .reduce((sum, i) => sum + i.runtime, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Genre breakdown (from watched movies only)
    const genreCounts = {};
    items
      .filter((i) => i.is_watched && i.genres)
      .forEach((i) => {
        i.genres.split(',').forEach((g) => {
          const genre = g.trim();
          if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const maxGenreCount = topGenres[0]?.[1] || 1;

    // Decade breakdown
    const decadeCounts = {};
    items
      .filter((i) => i.is_watched && i.release_year)
      .forEach((i) => {
        const decade = Math.floor(i.release_year / 10) * 10;
        decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
      });
    const decades = Object.entries(decadeCounts)
      .sort((a, b) => Number(a[0]) - Number(b[0]));
    const maxDecadeCount = Math.max(...decades.map(([, c]) => c), 1);

    // Top rated
    const topRated = [...items]
      .filter((i) => i.rating !== null)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    // Ratings distribution
    const distribution = [2, 4, 6, 8, 10].map((score) => ({
      label: `${score / 2}★`,
      score,
      count: items.filter((i) => i.rating === score).length
    }));
    const maxCount = Math.max(...distribution.map((d) => d.count), 1);

    return {
      total, watched, rated, avgRating,
      hours, minutes,
      topGenres, maxGenreCount,
      decades, maxDecadeCount,
      topRated, distribution, maxCount
    };
  }, [items]);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 reveal">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-10 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300/80">Your stats</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-100">Profile</h1>
        <p className="mt-2 text-sm text-slate-400">A picture of your taste in film.</p>

        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}
        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            {/* Stat cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'In watchlist', value: stats.total, color: 'text-slate-100' },
                { label: 'Watched', value: stats.watched, color: 'text-emerald-400' },
                { label: 'Avg rating', value: stats.avgRating, color: 'text-yellow-400' },
                {
                  label: 'Time watched',
                  value: stats.hours > 0 ? `${stats.hours}h ${stats.minutes}m` : stats.watched > 0 ? '—' : '—',
                  color: 'text-red-400',
                  sub: stats.hours > 0 ? 'from tracked runtimes' : null
                }
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{stat.label}</p>
                  <p className={`mt-3 text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
                  {stat.sub && <p className="mt-1 text-[10px] text-slate-600">{stat.sub}</p>}
                </div>
              ))}
            </div>

            {/* Genre taste */}
            {stats.topGenres.length > 0 && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-base font-semibold text-slate-100">Your top genres</h2>
                <p className="mt-1 text-xs text-slate-500">Based on movies you've watched</p>
                <div className="mt-5 space-y-3">
                  {stats.topGenres.map(([genre, count]) => {
                    const pct = Math.round((count / stats.maxGenreCount) * 100);
                    return (
                      <div key={genre} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-xs font-semibold text-slate-300">{genre}</span>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-xs text-slate-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Decades */}
            {stats.decades.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-base font-semibold text-slate-100">Decades you love</h2>
                <p className="mt-1 text-xs text-slate-500">Era breakdown of your watched movies</p>
                <div className="mt-5 flex items-end gap-3">
                  {stats.decades.map(([decade, count]) => {
                    const heightPct = Math.max(8, Math.round((count / stats.maxDecadeCount) * 100));
                    return (
                      <div key={decade} className="flex flex-1 flex-col items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400">{count}</span>
                        <div className="relative w-full overflow-hidden rounded-t-lg bg-slate-800" style={{ height: 64 }}>
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-gradient-to-t from-red-600/80 to-red-400/50 transition-all duration-700"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{decade}s</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ratings distribution */}
            {stats.rated > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-base font-semibold text-slate-100">Ratings distribution</h2>
                <div className="mt-5 flex items-end gap-3">
                  {stats.distribution.map((bucket) => {
                    const heightPct = bucket.count ? Math.max(8, Math.round((bucket.count / stats.maxCount) * 100)) : 4;
                    return (
                      <div key={bucket.score} className="flex flex-1 flex-col items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400">{bucket.count || ''}</span>
                        <div className="relative w-full overflow-hidden rounded-t-lg bg-slate-800" style={{ height: 64 }}>
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
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-base font-semibold text-slate-100">Your top rated</h2>
              <div className="mt-4 space-y-3">
                {stats.topRated.length === 0 && <p className="text-sm text-slate-400">No ratings yet.</p>}
                {stats.topRated.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-600">#{index + 1}</span>
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title} className="h-10 w-7 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-7 rounded bg-slate-800" />
                    )}
                    <p className="flex-1 text-sm text-slate-200">{item.title}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-sm ${star <= Math.round((item.rating || 0) / 2) ? 'text-yellow-400' : 'text-slate-700'}`}>★</span>
                      ))}
                      <span className="ml-2 text-xs text-slate-400">{item.rating}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            {stats.total > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Overall watch progress</span>
                  <span className="font-semibold text-emerald-400">
                    {Math.round((stats.watched / stats.total) * 100)}%
                  </span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500/80 transition-all duration-700"
                    style={{ width: `${Math.round((stats.watched / stats.total) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-600">{stats.watched} of {stats.total} watched</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
