import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getDirectorFilmography } from '../services/tmdb';
import { getWatchlist } from '../services/watchlist';
import { TMDB_IMAGE_BASE } from '../utils/constants';

export default function DirectorDeepDive() {
  const { name } = useParams();
  const { token } = useAuth();
  const directorName = decodeURIComponent(name);

  const [director, setDirector] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      getDirectorFilmography(directorName),
      getWatchlist(token).catch(() => []),
    ])
      .then(([directorData, watchlistData]) => {
        setDirector(directorData);
        setWatchlist(watchlistData || []);
      })
      .catch((err) => setError(err.message || 'Failed to load director.'))
      .finally(() => setLoading(false));
  }, [directorName, token]);

  const watchedIds = useMemo(
    () => new Set(watchlist.filter((i) => i.is_watched).map((i) => i.tmdb_movie_id)),
    [watchlist]
  );
  const watchlistIds = useMemo(
    () => new Set(watchlist.map((i) => i.tmdb_movie_id)),
    [watchlist]
  );

  const films = director?.directed || [];
  const watchedCount = films.filter((f) => watchedIds.has(f.id)).length;
  const unwatched = films.filter((f) => !watchedIds.has(f.id) && f.poster_path);
  const watched = films.filter((f) => watchedIds.has(f.id) && f.poster_path);

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-1/3 rounded-2xl bg-slate-800" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-slate-800" />
            ))}
          </div>
        </div>
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

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 reveal">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex items-center gap-6">
          {director?.profile_path ? (
            <img
              src={`${TMDB_IMAGE_BASE}/w185${director.profile_path}`}
              alt={directorName}
              className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-800 text-2xl font-bold text-slate-500">
              {directorName[0]}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300/80">
              Filmmaker
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-100">
              {directorName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                {films.length} films
              </span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-600/10 px-3 py-1 text-emerald-400">
                {watchedCount} watched
              </span>
              <span className="rounded-full border border-yellow-500/20 bg-yellow-600/10 px-3 py-1 text-yellow-400">
                {unwatched.length} to watch
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {films.length > 0 && (
          <div className="relative mt-6">
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500/80 transition-all duration-700"
                style={{ width: `${Math.round((watchedCount / films.length) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-600">
              {Math.round((watchedCount / films.length) * 100)}% of their filmography watched
            </p>
          </div>
        )}
      </div>

      {/* Unwatched films */}
      {unwatched.length > 0 && (
        <div className="mt-10 reveal">
          <div className="flex items-center gap-4 mb-5">
            <h2 className="shrink-0 text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              Still to watch
            </h2>
            <div className="h-px flex-1 bg-white/5" />
            <span className="shrink-0 text-[10px] text-slate-600">{unwatched.length} films</span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {unwatched.map((film) => (
              <FilmCard
                key={film.id}
                film={film}
                inWatchlist={watchlistIds.has(film.id)}
                watched={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Watched films */}
      {watched.length > 0 && (
        <div className="mt-10 reveal">
          <div className="flex items-center gap-4 mb-5">
            <h2 className="shrink-0 text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              Already watched
            </h2>
            <div className="h-px flex-1 bg-white/5" />
            <span className="shrink-0 text-[10px] text-slate-600">{watched.length} films</span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {watched.map((film) => (
              <FilmCard
                key={film.id}
                film={film}
                inWatchlist={watchlistIds.has(film.id)}
                watched={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Films without posters (list fallback) */}
      {films.filter((f) => !f.poster_path).length > 0 && (
        <div className="mt-10 reveal">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="shrink-0 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Other works
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="space-y-1.5">
            {films.filter((f) => !f.poster_path).map((film) => (
              <Link
                key={film.id}
                to={`/movies/${film.id}`}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/50 px-4 py-2.5 text-sm transition hover:border-red-500/20"
              >
                <span className="text-slate-300">{film.title}</span>
                <span className="text-xs text-slate-600">
                  {film.release_date ? film.release_date.split('-')[0] : ''}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FilmCard({ film, inWatchlist, watched }) {
  const year = film.release_date ? film.release_date.split('-')[0] : '';

  return (
    <Link
      to={`/movies/${film.id}`}
      className="group relative flex flex-col gap-2"
    >
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-800">
        <img
          src={`${TMDB_IMAGE_BASE}/w300${film.poster_path}`}
          alt={film.title}
          className={`aspect-[2/3] w-full object-cover transition duration-300 group-hover:scale-105 ${watched ? 'brightness-50' : ''}`}
        />
        {watched && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-emerald-500/50 bg-emerald-600/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              ✓ Watched
            </span>
          </div>
        )}
        {!watched && inWatchlist && (
          <div className="absolute bottom-1.5 left-1.5">
            <span className="rounded-full border border-red-500/40 bg-red-600/20 px-1.5 py-0.5 text-[9px] font-semibold text-red-300">
              In queue
            </span>
          </div>
        )}
        {film.vote_average > 0 && (
          <div className="absolute right-1.5 top-1.5">
            <span className="rounded-full border border-yellow-500/30 bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-semibold text-yellow-400">
              ★ {film.vote_average.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] font-semibold leading-tight text-slate-300 group-hover:text-red-300 transition line-clamp-2">
          {film.title}
        </p>
        {year && <p className="mt-0.5 text-[10px] text-slate-600">{year}</p>}
      </div>
    </Link>
  );
}
