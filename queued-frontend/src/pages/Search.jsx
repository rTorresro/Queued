import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import MovieCard from '../components/MovieCard';
import API_BASE_URL from '../config';

const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western'
};

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [addingId, setAddingId] = useState(null);
  const [addedId, setAddedId] = useState(null);
  const { token } = useAuth();
  const headerBackdrop = results.find((m) => m.backdrop_path)?.backdrop_path || null;
  const skeletonCards = Array.from({ length: 6 });
  const suggestions = ['Dune', 'The Batman', 'Interstellar', 'Blade Runner 2049'];
  const topRated = results.reduce((best, movie) => {
    if (!movie.vote_average) return best;
    if (!best) return movie;
    return movie.vote_average > best.vote_average ? movie : best;
  }, null);
  const location = useLocation();

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/watchlist`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWatchlistIds(new Set(data.map((i) => i.tmdb_movie_id)));
      })
      .catch(() => {});
  }, [token]);

  const performSearch = async (searchTerm) => {
    setError('');
    setIsLoading(true);
    if (!searchTerm.trim()) {
      setError('Enter a movie title to search.');
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/movies/search?query=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Search failed'); return; }
      setResults(data.results || []);
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await performSearch(query);
  };

  const handleAddToWatchlist = async (movie) => {
    setAddingId(movie.id);
    const genres = movie.genre_ids?.map((id) => GENRE_MAP[id]).filter(Boolean).join(',') || null;
    const releaseYear = movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null;
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tmdbMovieId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path || null,
          genres,
          releaseYear
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Failed to add'); return; }
      setWatchlistIds((prev) => new Set([...prev, movie.id]));
      setAddedId(movie.id);
      setTimeout(() => setAddedId(null), 2000);
    } catch {
      setError('Network error');
    } finally {
      setAddingId(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchTerm = params.get('query');
    if (searchTerm && searchTerm !== query) {
      setQuery(searchTerm);
      performSearch(searchTerm);
    }
  }, [location.search, query]);

  return (
    <section id="search" className="mx-auto w-full max-w-6xl px-6 py-10 reveal">
      <div
        className="glass-panel relative overflow-hidden rounded-3xl p-8 shadow-2xl"
        style={
          headerBackdrop
            ? { backgroundImage: `url(https://image.tmdb.org/t/p/w1280${headerBackdrop})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/40" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-semibold text-slate-100">Search</h1>
          <p className="mt-2 text-sm text-slate-400">Find movies and add them to your watchlist.</p>
          <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies..."
              className="h-11 flex-1 rounded-full border border-white/10 bg-slate-900/70 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500/60 focus:outline-none focus:ring-4 focus:ring-red-500/10"
            />
            <button type="submit" className="h-11 rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-500">
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-500">Try</span>
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => { setQuery(item); performSearch(item); }}
                className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-red-500/40 hover:text-red-200"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Results</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">{results.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Top rated</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">{topRated ? topRated.title : '—'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Score</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">
                {topRated?.vote_average ? topRated.vote_average.toFixed(1) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {!error && results.length === 0 && !isLoading && (
          <p className="text-sm text-slate-400">Start typing a title above to see results.</p>
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 reveal">
        {isLoading &&
          skeletonCards.map((_, i) => (
            <div key={`sk-${i}`} className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
              <div className="h-56 w-full bg-slate-800" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-slate-800" />
                <div className="h-3 w-full rounded bg-slate-800" />
                <div className="h-8 w-32 rounded-full bg-slate-800" />
              </div>
            </div>
          ))}
        {!isLoading &&
          results.map((movie) => {
            const inWatchlist = watchlistIds.has(movie.id);
            const justAdded = addedId === movie.id;
            return (
              <MovieCard
                key={movie.id}
                title={movie.title}
                posterPath={movie.poster_path}
                description={movie.overview}
                tmdbId={movie.id}
                badge={inWatchlist ? 'In Watchlist' : undefined}
                actions={
                  inWatchlist ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-600/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                      ✓ In Watchlist
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddToWatchlist(movie)}
                      disabled={addingId === movie.id}
                      className={`rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
                        justAdded
                          ? 'bg-emerald-600'
                          : 'bg-red-600 hover:bg-red-500 disabled:opacity-60'
                      }`}
                    >
                      {addingId === movie.id ? 'Adding…' : justAdded ? '✓ Added' : 'Add to Watchlist'}
                    </button>
                  )
                }
              />
            );
          })}
      </div>
    </section>
  );
}
