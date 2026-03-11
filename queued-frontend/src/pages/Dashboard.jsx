import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import API_BASE_URL from '../config';

function MonthlyGoal({ items }) {
  const [goal, setGoal] = useState(() => parseInt(localStorage.getItem('queued_monthly_goal') || '0'));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const now = new Date();
  const watchedThisMonth = items.filter((i) => {
    if (!i.is_watched || !i.added_at) return false;
    const d = new Date(i.added_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const pct = goal > 0 ? Math.min(100, Math.round((watchedThisMonth / goal) * 100)) : 0;

  const save = () => {
    const val = parseInt(draft);
    if (!isNaN(val) && val > 0) {
      setGoal(val);
      localStorage.setItem('queued_monthly_goal', String(val));
    }
    setEditing(false);
  };

  const monthName = now.toLocaleString('default', { month: 'long' });

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 reveal">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{monthName} goal</p>
          {goal === 0 ? (
            <p className="mt-1 text-sm text-slate-400">No goal set yet.</p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {watchedThisMonth} <span className="text-slate-500">/ {goal} movies</span>
            </p>
          )}
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="99"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              autoFocus
              className="w-16 rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-center text-sm text-slate-100 focus:border-red-500/50 focus:outline-none"
            />
            <button type="button" onClick={save} className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-500">
              Set
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(goal > 0 ? String(goal) : ''); setEditing(true); }}
            className="rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
          >
            {goal > 0 ? 'Edit goal' : 'Set goal'}
          </button>
        )}
      </div>
      {goal > 0 && (
        <>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500/80' : 'bg-red-500/70'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-600">
            {pct >= 100 ? 'Goal reached! 🎉' : `${goal - watchedThisMonth} more to go`}
          </p>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slowLoad, setSlowLoad] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setSlowLoad(true), 5000);
    const fetchWatchlist = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/watchlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setItems(data || []);
        else setError(data?.error || 'Failed to load');
      } catch {
        setError('Network error');
      } finally {
        clearTimeout(timer);
        setLoading(false);
        setSlowLoad(false);
      }
    };
    fetchWatchlist();
    return () => clearTimeout(timer);
  }, [token]);

  // Fetch recommendations based on top genres once watchlist loads
  useEffect(() => {
    if (loading || items.length === 0) return;
    const genreCounts = {};
    items.filter((i) => i.is_watched && i.genres).forEach((i) => {
      i.genres.split(',').forEach((g) => {
        const genre = g.trim();
        if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);
    if (topGenres.length === 0) return;

    const watchedIds = new Set(items.map((i) => i.tmdb_movie_id));
    fetch(`${API_BASE_URL}/movies/recommend?genres=${encodeURIComponent(topGenres.join(','))}`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.results || [])
          .filter((m) => m.poster_path && !watchedIds.has(m.id))
          .slice(0, 6);
        setRecommendations(filtered);
      })
      .catch(() => {});
  }, [loading, items]);

  const stats = useMemo(() => {
    const total = items.length;
    const watched = items.filter((i) => i.is_watched).length;
    const unwatched = total - watched;
    const rated = items.filter((i) => i.rating !== null).length;
    const avgRating = rated
      ? (items.reduce((sum, i) => sum + (i.rating || 0), 0) / rated).toFixed(1)
      : null;
    const progress = total ? Math.round((watched / total) * 100) : 0;
    return { total, watched, unwatched, rated, avgRating, progress };
  }, [items]);

  const recentlyAdded = items.slice(0, 4);
  const topRated = [...items]
    .filter((i) => i.rating !== null)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);
  const nextUp = items.filter((i) => !i.is_watched).slice(0, 4);

  return (
    <section id="dashboard" className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-12 reveal">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300/80">Your dashboard</p>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-100">What's on your queue?</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/search" className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-500">
              Search movies
            </Link>
            <Link to="/watchlist" className="rounded-full border border-white/10 bg-slate-900/70 px-6 py-2 text-sm font-semibold text-slate-100 transition hover:border-red-500/40 hover:text-red-200">
              View watchlist
            </Link>
          </div>
        </div>
      </div>

      {/* Slow load notice */}
      {slowLoad && (
        <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-4">
          <p className="text-sm text-yellow-300/80">⏳ Server is warming up — this can take up to 30 seconds on first load. Hang tight...</p>
        </div>
      )}

      {loading && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div className="h-3 w-1/2 rounded bg-slate-800" />
              <div className="mt-4 h-8 w-1/3 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          {/* Stats grid */}
          <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4 reveal">
            {[
              { label: 'Total queued', value: stats.total, color: 'text-slate-100' },
              { label: 'Watched', value: stats.watched, color: 'text-emerald-400' },
              { label: 'Still to watch', value: stats.unwatched, color: 'text-yellow-400' },
              { label: 'Avg rating', value: stats.avgRating ? `${stats.avgRating}/10` : '—', color: 'text-red-400' }
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                <p className={`mt-3 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {stats.total > 0 && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 reveal">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Watch progress</span>
                <span className="font-semibold text-emerald-400">{stats.progress}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-emerald-500/80 transition-all duration-700" style={{ width: `${stats.progress}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-slate-600">{stats.watched} of {stats.total} watched</p>
            </div>
          )}

          <MonthlyGoal items={items} />

          {/* Empty state */}
          {stats.total === 0 && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/70 p-10 text-center reveal">
              <p className="text-2xl">🎬</p>
              <h2 className="mt-3 text-lg font-semibold text-slate-100">Your queue is empty</h2>
              <p className="mt-2 text-sm text-slate-400">Start by searching for a movie you want to watch.</p>
              <Link to="/search" className="mt-6 inline-flex rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500">
                Find something to watch →
              </Link>
            </div>
          )}

          {/* Next up */}
          {nextUp.length > 0 && (
            <div className="mt-10 reveal">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Next up</h2>
                <Link to="/watchlist" className="text-xs font-semibold text-red-400 hover:text-red-300">See all →</Link>
              </div>
              <p className="mt-1 text-sm text-slate-400">Movies you haven't watched yet.</p>
              <div className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
                {nextUp.map((item) => (
                  <Link
                    key={item.id}
                    to={`/movies/${item.tmdb_movie_id}`}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 transition hover:border-red-500/30"
                  >
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.title} className="h-36 w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-36 items-center justify-center bg-slate-800 text-xs text-slate-500">No image</div>
                    )}
                    <div className="p-3">
                      <p className="text-xs font-semibold text-slate-100 leading-snug">{item.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-10 reveal">
              <h2 className="text-lg font-semibold text-slate-100">Recommended for you</h2>
              <p className="mt-1 text-sm text-slate-400">Based on genres you love.</p>
              <div className="mt-4 grid gap-3 grid-cols-3 sm:grid-cols-6">
                {recommendations.map((m) => (
                  <Link key={m.id} to={`/movies/${m.id}`} className="group flex flex-col gap-2">
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      <img src={`https://image.tmdb.org/t/p/w300${m.poster_path}`} alt={m.title} className="h-28 w-full object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                    <p className="text-[10px] font-semibold leading-tight text-slate-400 group-hover:text-red-300 line-clamp-2">{m.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recently added + Top rated */}
          <div className="mt-10 grid gap-6 lg:grid-cols-2 reveal">
            {recentlyAdded.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-base font-semibold text-slate-100">Recently added</h2>
                <div className="mt-4 space-y-3">
                  {recentlyAdded.map((item) => (
                    <Link key={item.id} to={`/movies/${item.tmdb_movie_id}`} className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/50 p-2 transition hover:border-red-500/20">
                      {item.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title} className="h-12 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-8 rounded-lg bg-slate-800" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                        <p className="text-[10px] text-slate-500">{item.is_watched ? 'Watched' : 'Not watched'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {topRated.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-base font-semibold text-slate-100">Your top rated</h2>
                <div className="mt-4 space-y-3">
                  {topRated.map((item, index) => (
                    <Link key={item.id} to={`/movies/${item.tmdb_movie_id}`} className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/50 p-2 transition hover:border-red-500/20">
                      <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-500">#{index + 1}</span>
                      {item.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title} className="h-12 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-8 rounded-lg bg-slate-800" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-yellow-400">{item.rating}/10</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
