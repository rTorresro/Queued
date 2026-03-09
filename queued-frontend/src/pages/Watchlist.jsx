import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import MovieCard from '../components/MovieCard';
import Rating from '../components/Rating';
import API_BASE_URL from '../config';

const FILTER_OPTIONS = ['All', 'Unwatched', 'Watched'];
const SORT_OPTIONS = [
  { label: 'Date added', value: 'date' },
  { label: 'Title', value: 'title' },
  { label: 'Rating', value: 'rating' }
];

export default function Watchlist() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('date');
  const [nextId, setNextId] = useState(() => {
    const stored = localStorage.getItem('queued_next_id');
    return stored ? parseInt(stored) : null;
  });

  const headerBackdrop = items[0]?.poster_path || null;
  const watchedCount = items.filter((i) => i.is_watched).length;
  const progress = items.length ? Math.round((watchedCount / items.length) * 100) : 0;
  const ratedCount = items.filter((i) => i.rating !== null).length;
  const avgRating = ratedCount
    ? (items.reduce((sum, i) => sum + (i.rating || 0), 0) / ratedCount).toFixed(1)
    : '—';

  const nextItem = useMemo(
    () => items.find((i) => i.id === nextId && !i.is_watched) || null,
    [items, nextId]
  );

  const displayedItems = useMemo(() => {
    let filtered = items.filter((i) => i.id !== nextId || i.is_watched);
    if (filter === 'Watched') filtered = filtered.filter((i) => i.is_watched);
    if (filter === 'Unwatched') filtered = filtered.filter((i) => !i.is_watched);
    if (sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'rating') filtered.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    return filtered;
  }, [items, filter, sort, nextId]);

  const handlePinNext = (id) => {
    if (nextId === id) {
      setNextId(null);
      localStorage.removeItem('queued_next_id');
    } else {
      setNextId(id);
      localStorage.setItem('queued_next_id', String(id));
    }
  };

  const fetchWatchlist = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Failed to load watchlist'); return; }
      setItems(data || []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const d = await res.json(); setError(d?.error || 'Failed to delete'); return; }
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (nextId === id) { setNextId(null); localStorage.removeItem('queued_next_id'); }
    } catch { setError('Network error'); }
  };

  const handleToggleWatched = async (item) => {
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isWatched: !item.is_watched, rating: item.rating ?? null })
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Failed to update'); return; }
      setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
      if (nextId === item.id && !item.is_watched) { setNextId(null); localStorage.removeItem('queued_next_id'); }
    } catch { setError('Network error'); }
  };

  const handleRate = async (item, value) => {
    const ratingValue = value === null ? null : Number(value);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, rating: ratingValue } : i)));
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isWatched: item.is_watched, rating: ratingValue })
      });
      const data = await res.json();
      if (res.ok) setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
    } catch { /* silent — optimistic update already applied */ }
  };

  return (
    <section id="watchlist" className="mx-auto w-full max-w-6xl px-6 py-10 reveal">
      {/* Header */}
      <div
        className="glass-panel relative overflow-hidden rounded-3xl p-8 shadow-2xl"
        style={
          headerBackdrop
            ? { backgroundImage: `url(https://image.tmdb.org/t/p/w1280${headerBackdrop})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/40" />
        <div className="absolute -right-24 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-semibold text-slate-100">Watchlist</h1>
          <p className="mt-2 text-sm text-slate-400">Manage what you plan to watch next.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">Total: {items.length}</span>
            <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">Watched: {watchedCount}</span>
            <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">Progress: {progress}%</span>
            <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">Avg rating: {avgRating}</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-900/70">
            <div className="h-full rounded-full bg-emerald-500/80 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Up Next */}
      {nextItem && (
        <div className="mt-6 reveal">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-red-300/80">Up next</p>
          <div className="flex items-center gap-4 rounded-2xl border border-red-500/20 bg-slate-900/80 p-4">
            {nextItem.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w185${nextItem.poster_path}`}
                alt={nextItem.title}
                className="h-20 w-14 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="h-20 w-14 shrink-0 rounded-xl bg-slate-800" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-100">{nextItem.title}</p>
              <p className="mt-1 text-xs text-slate-500">Pinned as your next watch</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => handleToggleWatched(nextItem)}
                className="rounded-full bg-emerald-600/20 border border-emerald-500/30 px-4 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/30"
              >
                Mark watched
              </button>
              <button
                type="button"
                onClick={() => handlePinNext(nextItem.id)}
                className="rounded-full border border-white/10 bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
              >
                Unpin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter + Sort */}
      {!loading && items.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 reveal">
          <div className="flex items-center gap-2">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  filter === f
                    ? 'border-emerald-500/50 bg-emerald-600/20 text-emerald-200'
                    : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/20'
                }`}
              >
                {f}
                {f === 'Watched' && ` (${watchedCount})`}
                {f === 'Unwatched' && ` (${items.length - watchedCount})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500">Sort</span>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSort(s.value)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  sort === s.value
                    ? 'border-red-500/50 bg-red-600/10 text-red-200'
                    : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/20'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        {loading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
                <div className="h-56 w-full bg-slate-800" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-slate-800" />
                  <div className="h-8 w-32 rounded-full bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-sm text-slate-400">
            <p>No items yet. Start building your queue.</p>
            <Link to="/search" className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500">
              Search movies
            </Link>
          </div>
        )}
        {!loading && items.length > 0 && displayedItems.length === 0 && (
          <p className="text-sm text-slate-400">No items match this filter.</p>
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 reveal">
        {!loading &&
          displayedItems.map((item) => (
            <MovieCard
              key={item.id}
              title={item.title}
              posterPath={item.poster_path}
              tmdbId={item.tmdb_movie_id}
              actions={
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleWatched(item)}
                    className={`rounded-full border border-white/10 px-3 py-1 text-xs font-semibold transition ${
                      item.is_watched
                        ? 'bg-emerald-600/20 text-emerald-200 hover:border-emerald-400/60'
                        : 'bg-slate-900/70 text-slate-100 hover:border-emerald-500/40 hover:text-emerald-200'
                    }`}
                  >
                    {item.is_watched ? '✓ Watched' : 'Not Watched'}
                  </button>
                  {!item.is_watched && (
                    <button
                      type="button"
                      onClick={() => handlePinNext(item.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        nextId === item.id
                          ? 'border-red-500/50 bg-red-600/10 text-red-300'
                          : 'border-white/10 bg-slate-900/70 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {nextId === item.id ? '📌 Next' : 'Watch Next'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:border-red-500/40 hover:text-red-200"
                  >
                    Remove
                  </button>
                </div>
              }
            >
              <Rating
                value={item.rating ?? ''}
                onRate={(value) => handleRate(item, value)}
              />
            </MovieCard>
          ))}
      </div>
    </section>
  );
}
