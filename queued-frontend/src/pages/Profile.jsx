import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { getWatchlist } from '../services/watchlist';
import { getAIPersonality } from '../services/tmdb';
import useWatchlistStats from '../hooks/useWatchlistStats';
import { TMDB_IMAGE_BASE } from '../utils/constants';

export default function Profile() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [personality, setPersonality] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('queued_personality') || 'null'); } catch { return null; }
  });
  const [personalityLoading, setPersonalityLoading] = useState(false);
  const [personalityError, setPersonalityError] = useState('');

  useEffect(() => {
    setError('');
    setLoading(true);
    getWatchlist(token)
      .then((data) => setItems(data || []))
      .catch((err) => setError(err.message || 'Network error'))
      .finally(() => setLoading(false));
  }, [token]);

  const stats = useWatchlistStats(items);

  const handleGeneratePersonality = async () => {
    setPersonalityLoading(true);
    setPersonalityError('');
    try {
      const data = await getAIPersonality(token);
      setPersonality(data);
      sessionStorage.setItem('queued_personality', JSON.stringify(data));
    } catch (err) {
      setPersonalityError(err.message || 'Failed to generate personality.');
    } finally {
      setPersonalityLoading(false);
    }
  };

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
                  value: stats.hours > 0 ? `${stats.hours}h ${stats.minutes}m` : '—',
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

            {/* Film Personality */}
            {stats.watched >= 5 && (
              <div className="mt-8 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/30 to-slate-900/70 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300/80">AI insight</p>
                    <h2 className="mt-2 text-base font-semibold text-slate-100">Your film personality</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePersonality}
                    disabled={personalityLoading}
                    className="shrink-0 rounded-full border border-red-500/30 bg-red-600/10 px-4 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-600/20 disabled:opacity-50"
                  >
                    {personalityLoading ? 'Analyzing…' : personality ? 'Refresh' : 'Generate'}
                  </button>
                </div>
                {personalityError && (
                  <p className="mt-3 text-sm text-red-400">{personalityError}</p>
                )}
                {personalityLoading && (
                  <div className="mt-4 space-y-2 animate-pulse">
                    <div className="h-5 w-1/3 rounded bg-slate-800" />
                    <div className="h-3 w-full rounded bg-slate-800" />
                    <div className="h-3 w-4/5 rounded bg-slate-800" />
                  </div>
                )}
                {!personalityLoading && personality && (
                  <div className="mt-4">
                    <p className="text-lg font-bold text-red-300">{personality.type}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{personality.description}</p>
                  </div>
                )}
                {!personalityLoading && !personality && !personalityError && (
                  <p className="mt-3 text-sm text-slate-500">
                    Click Generate to get an AI-written take on your film taste.
                  </p>
                )}
              </div>
            )}

            {/* Year in Review */}
            {stats.yearMovies > 0 && (
              <div className="mt-8 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/30 to-slate-900/70 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300/80">{stats.currentYear} so far</p>
                <h2 className="mt-2 text-base font-semibold text-slate-100">Your year in film</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Films watched', value: stats.yearMovies, color: 'text-slate-100' },
                    { label: 'Hours watched', value: stats.yearHours > 0 ? `${stats.yearHours}h` : '—', color: 'text-red-400' },
                    { label: 'Top genre', value: stats.yearTopGenre || '—', color: 'text-purple-400' },
                    { label: 'Best rated', value: stats.yearBest ? `${stats.yearBest.rating}/10` : '—', color: 'text-yellow-400' }
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-white/5 bg-slate-900/50 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
                      <p className={`mt-2 text-xl font-bold ${s.color}`}>{s.value}</p>
                      {s.label === 'Best rated' && stats.yearBest && (
                        <p className="mt-1 text-[10px] leading-tight text-slate-500 truncate">{stats.yearBest.title}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                          <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700" style={{ width: `${pct}%` }} />
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
                          <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-gradient-to-t from-red-600/80 to-red-400/50 transition-all duration-700" style={{ height: `${heightPct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500">{decade}s</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Director stats */}
            {stats.topDirectors.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-base font-semibold text-slate-100">Directors you love</h2>
                <p className="mt-1 text-xs text-slate-500">Based on movies you've watched</p>
                <div className="mt-5 space-y-3">
                  {stats.topDirectors.map(([name, count]) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-xs font-semibold text-slate-300">{name}</span>
                      <div className="flex-1 flex gap-1">
                        {Array.from({ length: count }).map((_, i) => (
                          <div key={i} className="h-2 w-2 rounded-full bg-red-500/70" />
                        ))}
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs text-slate-500">{count} {count === 1 ? 'film' : 'films'}</span>
                    </div>
                  ))}
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
                          <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-gradient-to-t from-yellow-500/80 to-yellow-400/50 transition-all duration-700" style={{ height: `${heightPct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400">{bucket.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mood analytics */}
            {stats.moodStats.length > 0 && (
              <div className="mt-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-slate-900/70 p-6">
                <h2 className="text-base font-semibold text-slate-100">Your watching moods</h2>
                <p className="mt-1 text-xs text-slate-500">How you felt while watching each film</p>
                {stats.moodInsight && (
                  <p className="mt-3 text-sm text-purple-300/80 italic">"{stats.moodInsight}"</p>
                )}
                <div className="mt-5 space-y-2">
                  {stats.moodStats.map((m) => (
                    <div key={m.value} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-xs font-semibold text-slate-300">{m.label}</span>
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700"
                          style={{ width: `${Math.round((m.count / Math.max(...stats.moodStats.map((x) => x.count))) * 100)}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right text-xs text-slate-500">{m.count}</span>
                      {m.avgRating !== null && (
                        <span className="w-12 shrink-0 text-right text-xs font-semibold text-yellow-400">
                          {m.avgRating.toFixed(1)}/10
                        </span>
                      )}
                    </div>
                  ))}
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
                      <img src={`${TMDB_IMAGE_BASE}/w92${item.poster_path}`} alt={item.title} className="h-10 w-7 rounded object-cover" />
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
