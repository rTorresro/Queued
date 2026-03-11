import { useEffect, useState, useMemo, useRef } from 'react';
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
const RUNTIME_OPTIONS = [
  { label: 'Any length', value: 'any' },
  { label: 'Under 90m', value: 'short' },
  { label: '90–120m', value: 'medium' },
  { label: 'Over 2h', value: 'long' }
];

function SurpriseMeModal({ item, onClose, onMarkWatched }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {item.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
            alt={item.title}
            className="h-56 w-full object-cover"
          />
        )}
        <div className="p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-red-300/80">Tonight's pick</p>
          <h2 className="mt-2 text-xl font-bold text-slate-100">{item.title}</h2>
          {item.release_year && <p className="mt-1 text-xs text-slate-500">{item.release_year}</p>}
          {item.runtime && <p className="text-xs text-slate-500">{item.runtime} min</p>}
          {item.genres && (
            <p className="mt-2 text-xs text-slate-400">{item.genres.split(',').join(' · ')}</p>
          )}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => { onMarkWatched(item); onClose(); }}
              className="flex-1 rounded-full bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
            >
              Mark watched
            </button>
            <Link
              to={`/movies/${item.tmdb_movie_id}`}
              className="flex-1 rounded-full border border-white/10 bg-slate-800 py-2 text-center text-xs font-semibold text-slate-200 transition hover:border-white/20"
              onClick={onClose}
            >
              Details
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteField({ item, onSaveNote }) {
  const [note, setNote] = useState(item.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef(null);

  const save = async (value) => {
    if (value === (item.notes || '')) return;
    setSaving(true);
    await onSaveNote(item, value);
    setSaving(false);
    setSaved(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        placeholder="Add a quick note…"
        rows={2}
        className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:border-red-500/40 focus:outline-none"
      />
      {saving && <p className="mt-1 text-[10px] text-slate-500">Saving…</p>}
      {saved && <p className="mt-1 text-[10px] text-emerald-400">✓ Saved</p>}
    </div>
  );
}

export default function Watchlist() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('date');
  const [runtimeFilter, setRuntimeFilter] = useState('any');
  const [surpriseItem, setSurpriseItem] = useState(null);
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
    if (runtimeFilter === 'short') filtered = filtered.filter((i) => i.runtime && i.runtime < 90);
    if (runtimeFilter === 'medium') filtered = filtered.filter((i) => i.runtime && i.runtime >= 90 && i.runtime <= 120);
    if (runtimeFilter === 'long') filtered = filtered.filter((i) => i.runtime && i.runtime > 120);
    if (sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'rating') filtered.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    return filtered;
  }, [items, filter, sort, runtimeFilter, nextId]);

  const handlePinNext = (id) => {
    if (nextId === id) {
      setNextId(null);
      localStorage.removeItem('queued_next_id');
    } else {
      setNextId(id);
      localStorage.setItem('queued_next_id', String(id));
    }
  };

  const handleSurpriseMe = () => {
    const pool = items.filter((i) => !i.is_watched && i.id !== nextId);
    if (pool.length === 0) return;
    setSurpriseItem(pool[Math.floor(Math.random() * pool.length)]);
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

  const handleSaveNote = async (item, notes) => {
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes })
      });
      const data = await res.json();
      if (res.ok) setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
    } catch { /* silent */ }
  };

  const handleRewatch = async (item) => {
    const newCount = (item.rewatch_count || 0) + 1;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, rewatch_count: newCount } : i)));
    try {
      await fetch(`${API_BASE_URL}/watchlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rewatchCount: newCount })
      });
    } catch { /* silent */ }
  };

  return (
    <section id="watchlist" className="mx-auto w-full max-w-6xl px-6 py-10 reveal">
      {surpriseItem && (
        <SurpriseMeModal
          item={surpriseItem}
          onClose={() => setSurpriseItem(null)}
          onMarkWatched={handleToggleWatched}
        />
      )}

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-100">Watchlist</h1>
              <p className="mt-2 text-sm text-slate-400">Manage what you plan to watch next.</p>
            </div>
            {items.filter((i) => !i.is_watched).length > 0 && (
              <button
                type="button"
                onClick={handleSurpriseMe}
                className="shrink-0 rounded-full border border-red-500/30 bg-red-600/10 px-5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-600/20"
              >
                🎲 Surprise Me
              </button>
            )}
          </div>
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
              {nextItem.runtime && <p className="mt-0.5 text-xs text-slate-500">{nextItem.runtime} min</p>}
              <p className="mt-0.5 text-xs text-slate-500">Pinned as your next watch</p>
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

      {/* Filter + Sort + Runtime */}
      {!loading && items.length > 0 && (
        <div className="mt-6 space-y-3 reveal">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
          {/* Runtime filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500">⏱ Length</span>
            {RUNTIME_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRuntimeFilter(r.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  runtimeFilter === r.value
                    ? 'border-purple-500/50 bg-purple-600/10 text-purple-200'
                    : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/20'
                }`}
              >
                {r.label}
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
                  {item.is_watched && (
                    <button
                      type="button"
                      onClick={() => handleRewatch(item)}
                      className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-400 transition hover:border-purple-500/40 hover:text-purple-300"
                    >
                      ↺ Rewatch{item.rewatch_count > 0 ? ` (${item.rewatch_count}×)` : ''}
                    </button>
                  )}
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
              {item.is_watched && (
                <NoteField item={item} onSaveNote={handleSaveNote} />
              )}
            </MovieCard>
          ))}
      </div>
    </section>
  );
}
