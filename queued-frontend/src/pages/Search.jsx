import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import MovieCard from '../components/MovieCard';
import API_BASE_URL from '../config';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const headerBackdrop =
    results.find((movie) => movie.backdrop_path)?.backdrop_path || null;
  const skeletonCards = Array.from({ length: 6 });
  const suggestions = ['Dune', 'The Batman', 'Interstellar', 'Blade Runner 2049'];
  const topRated = results.reduce((best, movie) => {
    if (!movie.vote_average) return best;
    if (!best) return movie;
    return movie.vote_average > best.vote_average ? movie : best;
  }, null);
  const location = useLocation();

  const performSearch = async (searchTerm) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!searchTerm.trim()) {
      setError('Enter a movie title to search.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/movies/search?query=${encodeURIComponent(searchTerm)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Search failed');
        setIsLoading(false);
        return;
      }

      setResults(data.results || []);
    } catch (err) {
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
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tmdbMovieId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path || null
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Failed to add to watchlist');
        return;
      }

      setSuccess('Added to watchlist!');
    } catch (err) {
      setError('Network error');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchTerm = params.get('query');
    if (searchTerm && searchTerm !== query) {
      setQuery(searchTerm);
      performSearch(searchTerm);
    }
  }, [location.search]);

  return (
    <section id="search" className="mx-auto w-full max-w-6xl px-6 py-10 reveal">
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
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-semibold text-slate-100">Search</h1>
          <p className="mt-2 text-sm text-slate-400">
            Find movies and add them to your watchlist.
          </p>
          <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies..."
              className="h-11 flex-1 rounded-full border border-white/10 bg-slate-900/70 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500/60 focus:outline-none focus:ring-4 focus:ring-red-500/10"
            />
            <button
              type="submit"
              className="h-11 rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Suggestions
            </span>
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  performSearch(item);
                }}
                className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-red-500/40 hover:text-red-200"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Results</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">{results.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Top rated</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {topRated ? topRated.title : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Score</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">
                {topRated?.vote_average ? topRated.vote_average.toFixed(1) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 reveal">
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {success && <p className="mb-4 text-sm text-emerald-400">{success}</p>}
        {!error && results.length === 0 && (
          <p className="text-sm text-slate-400">
            Start typing a title above to see results.
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 reveal">
        {isLoading &&
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
        {!isLoading &&
          results.map((movie) => (
            <MovieCard
              key={movie.id}
              title={movie.title}
              posterPath={movie.poster_path}
              description={movie.overview}
              tmdbId={movie.id}
              actions={
                <button
                  type="button"
                  onClick={() => handleAddToWatchlist(movie)}
                  className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                >
                  Add to Watchlist
                </button>
              }
            />
          ))}
      </div>

      {!isLoading && results.length > 0 && (
        <div className="mt-12 reveal">
          <h2 className="text-lg font-semibold text-slate-100">Trending now</h2>
          <p className="mt-2 text-sm text-slate-400">
            Quick picks from your latest search results.
          </p>
          <div className="hide-scrollbar mt-4 flex gap-4 overflow-x-auto pb-2">
            {results.slice(0, 8).map((movie) => (
              <Link
                key={`trend-${movie.id}`}
                to={`/movies/${movie.id}`}
                className="poster-frame min-w-[140px] bg-slate-900/70 shadow-lg"
              >
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
                <div className="p-2 text-xs font-semibold text-slate-100">
                  {movie.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

