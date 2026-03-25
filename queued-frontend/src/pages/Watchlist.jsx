import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import MovieCard from '../components/MovieCard';
import Rating from '../components/Rating';
import NoteField from '../components/NoteField';
import MoodPicker from '../components/MoodPicker';
import SurpriseMeModal from '../components/SurpriseMeModal';
import AiPickerModal from '../components/AiPickerModal';
import { getWatchlist, updateWatchlistItem, deleteWatchlistItem } from '../services/watchlist';
import { getAIMoodPick, getProvidersBatch } from '../services/tmdb';
import { TMDB_IMAGE_BASE } from '../utils/constants';

const FILTER_OPTIONS = ['All', 'Unwatched', 'Watched'];
const SORT_OPTIONS = [
  { label: 'Date added', value: 'date' },
  { label: 'Title', value: 'title' },
  { label: 'Rating', value: 'rating' },
];
const RUNTIME_OPTIONS = [
  { label: 'Any length', value: 'any' },
  { label: 'Under 90m', value: 'short' },
  { label: '90–120m', value: 'medium' },
  { label: 'Over 2h', value: 'long' },
];

export default function Watchlist() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('date');
  const [runtimeFilter, setRuntimeFilter] = useState('any');
  const [surpriseItem, setSurpriseItem] = useState(null);
  const [aiPickItem, setAiPickItem] = useState(null);
  const [aiPickReason, setAiPickReason] = useState('');
  const [showAiPicker, setShowAiPicker] = useState(false);
  const [providerMap, setProviderMap] = useState({});
  const [selectedService, setSelectedService] = useState(null);
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

  const availableServices = useMemo(() => {
    const seen = {};
    Object.values(providerMap).forEach((providers) => {
      providers.forEach((p) => {
        if (!seen[p.provider_id]) {
          seen[p.provider_id] = { id: p.provider_id, name: p.provider_name, logo: p.logo_path };
        }
      });
    });
    return Object.values(seen).sort((a, b) => a.name.localeCompare(b.name));
  }, [providerMap]);

  const displayedItems = useMemo(() => {
    let filtered = items.filter((i) => i.id !== nextId || i.is_watched);
    if (filter === 'Watched') filtered = filtered.filter((i) => i.is_watched);
    if (filter === 'Unwatched') filtered = filtered.filter((i) => !i.is_watched);
    if (runtimeFilter === 'short') filtered = filtered.filter((i) => i.runtime && i.runtime < 90);
    if (runtimeFilter === 'medium') filtered = filtered.filter((i) => i.runtime && i.runtime >= 90 && i.runtime <= 120);
    if (runtimeFilter === 'long') filtered = filtered.filter((i) => i.runtime && i.runtime > 120);
    if (selectedService) {
      filtered = filtered.filter((i) => {
        const providers = providerMap[i.tmdb_movie_id] || [];
        return providers.some((p) => p.provider_id === selectedService);
      });
    }
    if (sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'rating') filtered.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    return filtered;
  }, [items, filter, sort, runtimeFilter, nextId, selectedService, providerMap]);

  const showTransientError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

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

  const handleAiPick = async ({ mood, runtime }) => {
    const data = await getAIMoodPick(token, { mood, runtime });
    setShowAiPicker(false);
    setAiPickItem(data.item);
    setAiPickReason(data.reason);
  };

  useEffect(() => {
    setError('');
    setLoading(true);
    getWatchlist(token)
      .then((data) => {
        const list = data || [];
        setItems(list);
        // Fetch streaming providers in the background for unwatched items
        const ids = list.filter((i) => !i.is_watched).map((i) => i.tmdb_movie_id).slice(0, 50);
        if (ids.length > 0) {
          getProvidersBatch(ids).then(setProviderMap).catch(() => {});
        }
      })
      .catch((err) => setError(err.message || 'Network error'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id) => {
    try {
      await deleteWatchlistItem(token, id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (nextId === id) { setNextId(null); localStorage.removeItem('queued_next_id'); }
    } catch (err) {
      showTransientError(err.message || 'Failed to delete');
    }
  };

  const handleToggleWatched = async (item) => {
    try {
      const data = await updateWatchlistItem(token, item.id, { isWatched: !item.is_watched, rating: item.rating ?? null });
      setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
      if (nextId === item.id && !item.is_watched) { setNextId(null); localStorage.removeItem('queued_next_id'); }
    } catch (err) {
      showTransientError(err.message || 'Failed to update');
    }
  };

  const handleRate = async (item, value) => {
    const ratingValue = value === null ? null : Number(value);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, rating: ratingValue } : i)));
    try {
      const data = await updateWatchlistItem(token, item.id, { isWatched: item.is_watched, rating: ratingValue });
      setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
    } catch (err) {
      // Revert optimistic update on failure
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, rating: item.rating } : i)));
      showTransientError(err.message || 'Failed to save rating');
    }
  };

  const handleSaveNote = async (item, notes) => {
    try {
      const data = await updateWatchlistItem(token, item.id, { notes });
      setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
    } catch (err) {
      showTransientError(err.message || 'Failed to save note');
    }
  };

  const handleRewatch = async (item) => {
    const newCount = (item.rewatch_count || 0) + 1;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, rewatch_count: newCount } : i)));
    try {
      await updateWatchlistItem(token, item.id, { rewatchCount: newCount });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, rewatch_count: item.rewatch_count } : i)));
      showTransientError(err.message || 'Failed to log rewatch');
    }
  };

  const handleMoodUpdate = async (item, mood) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, mood } : i)));
    try {
      await updateWatchlistItem(token, item.id, { mood });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, mood: item.mood } : i)));
      showTransientError(err.message || 'Failed to save mood');
    }
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
      {aiPickItem && (
        <SurpriseMeModal
          item={aiPickItem}
          reason={aiPickReason}
          onClose={() => { setAiPickItem(null); setAiPickReason(''); }}
          onMarkWatched={handleToggleWatched}
        />
      )}
      {showAiPicker && (
        <AiPickerModal
          onClose={() => setShowAiPicker(false)}
          onPick={handleAiPick}
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
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="absolute -right-24 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-100">Watchlist</h1>
              <p className="mt-2 text-sm text-slate-400">Manage what you plan to watch next.</p>
            </div>
            {items.filter((i) => !i.is_watched).length > 0 && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiPicker(true)}
                  className="rounded-full border border-purple-500/30 bg-purple-600/10 px-5 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-600/20"
                >
                  Pick for Me
                </button>
                <button
                  type="button"
                  onClick={handleSurpriseMe}
                  className="rounded-full border border-red-500/30 bg-red-600/10 px-5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-600/20"
                >
                  Surprise Me
                </button>
              </div>
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
              <img src={`https://image.tmdb.org/t/p/w185${nextItem.poster_path}`} alt={nextItem.title} className="h-20 w-14 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="h-20 w-14 shrink-0 rounded-xl bg-slate-800" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-100">{nextItem.title}</p>
              {nextItem.runtime && <p className="mt-0.5 text-xs text-slate-500">{nextItem.runtime} min</p>}
              <p className="mt-0.5 text-xs text-slate-500">Pinned as your next watch</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => handleToggleWatched(nextItem)} className="rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/30">
                Mark watched
              </button>
              <button type="button" onClick={() => handlePinNext(nextItem.id)} className="rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:text-slate-200">
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
                <button key={f} type="button" onClick={() => setFilter(f)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter === f ? 'border-emerald-500/50 bg-emerald-600/20 text-emerald-200' : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/20 hover:text-slate-200'}`}
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
                <button key={s.value} type="button" onClick={() => setSort(s.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${sort === s.value ? 'border-red-500/50 bg-red-600/10 text-red-200' : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/20 hover:text-slate-200'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500">Length</span>
            {RUNTIME_OPTIONS.map((r) => (
              <button key={r.value} type="button" onClick={() => setRuntimeFilter(r.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${runtimeFilter === r.value ? 'border-purple-500/50 bg-purple-600/10 text-purple-200' : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/20 hover:text-slate-200'}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {availableServices.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-500">Streaming</span>
              {selectedService && (
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:text-slate-200"
                >
                  ✕ Clear
                </button>
              )}
              {availableServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedService(selectedService === s.id ? null : s.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    selectedService === s.id
                      ? 'border-blue-500/50 bg-blue-600/20 text-blue-200'
                      : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  {s.logo && (
                    <img
                      src={`${TMDB_IMAGE_BASE}/w45${s.logo}`}
                      alt={s.name}
                      className="h-4 w-4 rounded object-cover"
                    />
                  )}
                  {s.name}
                </button>
              ))}
            </div>
          )}
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
            <Link to="/search" className="mt-4 inline-flex rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-red-500">
              Search movies
            </Link>
          </div>
        )}
        {!loading && items.length > 0 && displayedItems.length === 0 && (
          <p className="text-sm text-slate-400">No items match this filter.</p>
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 reveal">
        {!loading && displayedItems.map((item) => (
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
                  className={`rounded-full border border-white/10 px-3 py-1 text-xs font-semibold transition ${item.is_watched ? 'bg-emerald-600/20 text-emerald-200 hover:border-emerald-400/60' : 'bg-slate-900/70 text-slate-100 hover:border-emerald-500/40 hover:text-emerald-200'}`}
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
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${nextId === item.id ? 'border-red-500/50 bg-red-600/10 text-red-300' : 'border-white/10 bg-slate-900/70 text-slate-400 hover:text-slate-200'}`}
                  >
                    {nextId === item.id ? 'Pinned' : 'Watch Next'}
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
            <Rating value={item.rating ?? ''} onRate={(value) => handleRate(item, value)} />
            {item.is_watched && (
              <>
                <NoteField item={item} onSaveNote={handleSaveNote} />
                <MoodPicker item={item} onMoodUpdate={handleMoodUpdate} />
              </>
            )}
          </MovieCard>
        ))}
      </div>
    </section>
  );
}
