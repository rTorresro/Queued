import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import API_BASE_URL from '../config';

export default function MovieDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [providers, setProviders] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setError('');
      setLoading(true);
      try {
        const [movieRes, creditsRes, providersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/movies/${id}`),
          fetch(`${API_BASE_URL}/movies/${id}/credits`),
          fetch(`${API_BASE_URL}/movies/${id}/providers`)
        ]);
        const movieData = await movieRes.json();
        const creditsData = await creditsRes.json();
        const providersData = await providersRes.json();

        if (!movieRes.ok) { setError(movieData?.error || 'Failed to load movie.'); return; }

        setMovie(movieData);
        setCast(creditsData.cast?.slice(0, 8) || []);
        setProviders(providersData.results?.US || null);
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleAddToWatchlist = async () => {
    if (!movie || adding) return;
    setError('');
    setSuccess('');
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tmdbMovieId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path || null,
          runtime: movie.runtime || null,
          genres: movie.genres?.map((g) => g.name).join(',') || null,
          releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Failed to add to watchlist'); return; }
      setSuccess('Added to watchlist!');
    } catch {
      setError('Network error');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-1/3 rounded bg-slate-800" />
          <div className="h-80 rounded-2xl bg-slate-800" />
        </div>
      </section>
    );
  }

  if (error && !movie) {
    return <section className="mx-auto w-full max-w-6xl px-6 py-12"><p className="text-sm text-red-400">{error}</p></section>;
  }

  if (!movie) return null;

  const streamingProviders = providers?.flatrate || [];
  const rentProviders = providers?.rent || [];
  const buyProviders = providers?.buy || [];
  const hasProviders = streamingProviders.length > 0 || rentProviders.length > 0 || buyProviders.length > 0;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 reveal">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl"
        style={
          movie.backdrop_path
            ? { backgroundImage: `url(https://image.tmdb.org/t/p/w1280${movie.backdrop_path})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-900/30" />
        <div className="relative">
          <Link to="/search" className="text-xs font-semibold text-red-300">← Back to search</Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl">
              {movie.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-80 items-center justify-center text-sm text-slate-400">No poster</div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl">
              <h1 className="text-3xl font-semibold text-slate-100">{movie.title}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                {movie.release_date && <span>{movie.release_date.split('-')[0]}</span>}
                {movie.runtime > 0 && <span>{movie.runtime} min</span>}
                {movie.vote_average > 0 && (
                  <span className="text-yellow-400">★ {movie.vote_average.toFixed(1)} / 10</span>
                )}
              </div>
              {movie.genres?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span key={genre.id} className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-200">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-6 text-sm leading-relaxed text-slate-300">{movie.overview}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToWatchlist}
                  disabled={adding || Boolean(success)}
                  className={`rounded-full px-5 py-2 text-xs font-semibold text-white transition ${
                    success ? 'bg-emerald-600' : 'bg-red-600 hover:bg-red-500 disabled:opacity-60'
                  }`}
                >
                  {adding ? 'Adding…' : success ? '✓ Added' : 'Add to Watchlist'}
                </button>
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streaming availability */}
      <div className="mt-8 reveal">
        <h2 className="text-lg font-semibold text-slate-100">Where to watch</h2>
        {!hasProviders ? (
          <p className="mt-3 text-sm text-slate-500">Not available on major streaming services in the US right now.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {streamingProviders.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">Stream</p>
                <div className="flex flex-wrap gap-3">
                  {streamingProviders.map((p) => (
                    <div key={p.provider_id} className="flex flex-col items-center gap-1.5">
                      <img
                        src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                        alt={p.provider_name}
                        className="h-12 w-12 rounded-xl border border-white/10 object-cover"
                      />
                      <span className="text-[10px] text-slate-400">{p.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {rentProviders.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400/80">Rent</p>
                <div className="flex flex-wrap gap-3">
                  {rentProviders.map((p) => (
                    <div key={p.provider_id} className="flex flex-col items-center gap-1.5">
                      <img
                        src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                        alt={p.provider_name}
                        className="h-12 w-12 rounded-xl border border-white/10 object-cover opacity-80"
                      />
                      <span className="text-[10px] text-slate-400">{p.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {providers?.link && (
              <a
                href={providers.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
              >
                See all options on JustWatch →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Cast */}
      {cast.length > 0 && (
        <div className="mt-10 reveal">
          <h2 className="text-lg font-semibold text-slate-100">Cast</h2>
          <div className="mt-4 grid grid-cols-4 gap-4 sm:grid-cols-8">
            {cast.map((person) => (
              <div key={person.id} className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-slate-800">
                  {person.profile_path ? (
                    <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt={person.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-600 text-lg">?</div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold leading-tight text-slate-200">{person.name}</p>
                  {person.character && (
                    <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{person.character}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
