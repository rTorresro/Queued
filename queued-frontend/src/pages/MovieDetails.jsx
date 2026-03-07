import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import API_BASE_URL from '../config';

export default function MovieDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovie = async () => {
      setError('');
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE_URL}/movies/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || 'Failed to load movie.');
          return;
        }

        setMovie(data);
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleAddToWatchlist = async () => {
    if (!movie) return;
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

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <p className="text-sm text-slate-400">Loading...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <p className="text-sm text-red-400">{error}</p>
      </section>
    );
  }

  if (!movie) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 reveal">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl"
        style={
          movie.backdrop_path
            ? {
                backgroundImage: `url(https://image.tmdb.org/t/p/w1280${movie.backdrop_path})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-900/30" />
        <div className="relative">
          <Link to="/search" className="text-xs font-semibold text-red-300">
        ← Back to search
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl">
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-sm text-slate-400">
                  No poster
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl">
              <h1 className="text-3xl font-semibold text-slate-100">{movie.title}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                {movie.release_date && <span>{movie.release_date}</span>}
                {movie.runtime && <span>{movie.runtime} min</span>}
                {movie.vote_average && <span>{movie.vote_average.toFixed(1)} / 10</span>}
              </div>
              {movie.genres?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-200"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-6 text-sm text-slate-300">{movie.overview}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAddToWatchlist}
                  className="rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                >
                  Add to Watchlist
                </button>
                {success && <p className="text-xs text-emerald-400">{success}</p>}
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
