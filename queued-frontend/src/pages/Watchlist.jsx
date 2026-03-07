import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import MovieCard from '../components/MovieCard';
import Rating from '../components/Rating';
import API_BASE_URL from '../config';

export default function Watchlist() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const headerBackdrop = items[0]?.poster_path || null;
  const skeletonCards = Array.from({ length: 6 });
  const watchedCount = items.filter((item) => item.is_watched).length;
  const progress = items.length ? Math.round((watchedCount / items.length) * 100) : 0;
  const ratedCount = items.filter((item) => item.rating !== null).length;
  const avgRating = ratedCount
    ? (items.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedCount).toFixed(1)
    : '—';

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
        setError(data?.error || 'Failed to load watchlist');
        setLoading(false);
        return;
      }

      setItems(data || []);
    } catch (err) {
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
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Failed to delete item');
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Network error');
    }
  };

  const handleToggleWatched = async (item) => {
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isWatched: !item.is_watched,
          rating: item.rating ?? null
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Failed to update item');
        return;
      }

      setItems((prev) =>
        prev.map((current) => (current.id === item.id ? data : current))
      );
    } catch (err) {
      setError('Network error');
    }
  };

  const handleRatingChange = (id, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rating: value } : item
      )
    );
  };

  const handleSaveRating = async (item) => {
    setError('');

    const ratingValue =
      item.rating === '' || item.rating === null
        ? null
        : Number(item.rating);

    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isWatched: item.is_watched,
          rating: ratingValue
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Failed to update rating');
        return;
      }

      setItems((prev) =>
        prev.map((current) => (current.id === item.id ? data : current))
      );
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <section id="watchlist" className="mx-auto w-full max-w-6xl px-6 py-10 reveal">
      <div
        className="glass-panel relative overflow-hidden rounded-3xl p-8 shadow-2xl"
        style={
          headerBackdrop
            ? {
                backgroundImage: `url(https://image.tmdb.org/t/p/w1280${headerBackdrop})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/40" />
        <div className="absolute -right-24 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-semibold text-slate-100">Watchlist</h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage what you plan to watch next.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
              Total: {items.length}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
              Watched: {watchedCount}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
              Progress: {progress}%
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
              Avg rating: {avgRating}
            </span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-900/70">
            <div
              className="h-full rounded-full bg-emerald-500/80"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 reveal">
        {loading && <p className="text-sm text-slate-400">Loading...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-sm text-slate-400">
            <p>No items yet. Start building your queue.</p>
            <Link
              to="/search"
              className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
            >
              Search movies
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 reveal">
        {loading &&
          skeletonCards.map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70"
            >
              <div className="h-56 w-full bg-slate-800" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-slate-800" />
                <div className="h-3 w-full rounded bg-slate-800" />
                <div className="h-3 w-2/3 rounded bg-slate-800" />
                <div className="h-8 w-32 rounded-full bg-slate-800" />
              </div>
            </div>
          ))}
        {!loading &&
          items.map((item) => (
            <MovieCard
              key={item.id}
              title={item.title}
              posterPath={item.poster_path}
              tmdbId={item.tmdb_movie_id}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => handleToggleWatched(item)}
                    className={`rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-100 transition ${
                      item.is_watched
                        ? 'bg-emerald-600/20 text-emerald-200 hover:border-emerald-400/60'
                        : 'bg-slate-900/70 hover:border-emerald-500/40 hover:text-emerald-200'
                    }`}
                  >
                    {item.is_watched ? 'Watched' : 'Not Watched'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:border-red-500/40 hover:text-red-200"
                  >
                    Remove
                  </button>
                </>
              }
            >
              <Rating
                value={item.rating ?? ''}
                onChange={(value) => handleRatingChange(item.id, value)}
                onSave={() => handleSaveRating(item)}
              />
            </MovieCard>
          ))}
      </div>

      {!loading && items.length > 0 && (
        <div className="mt-12 reveal">
          <h2 className="text-lg font-semibold text-slate-100">Continue your queue</h2>
          <p className="mt-2 text-sm text-slate-400">
            Recently added titles from your watchlist.
          </p>
          <div className="hide-scrollbar mt-4 flex gap-4 overflow-x-auto pb-2">
            {items.slice(0, 8).map((item) => (
              <div
                key={`queue-${item.id}`}
                className="poster-frame min-w-[140px] bg-slate-900/70 shadow-lg"
              >
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                    alt={item.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
                <div className="p-2 text-xs font-semibold text-slate-100">
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}