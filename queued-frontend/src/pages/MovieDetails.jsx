import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  getMovie,
  getMovieCredits,
  getMovieVideos,
  getSimilarMovies,
  getStreamingProviders,
  getAIRatingPrediction,
} from '../services/tmdb';
import { addToWatchlist, deleteWatchlistItem } from '../services/watchlist';
import { TMDB_IMAGE_BASE, UNDO_TIMEOUT_MS } from '../utils/constants';

export default function MovieDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [director, setDirector] = useState(null);
  const [providers, setProviders] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addingAsSeen, setAddingAsSeen] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [addedItemId, setAddedItemId] = useState(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setError('');
      setLoading(true);
      try {
        const [movieData, creditsData, providersData, videosData, similarData] = await Promise.all([
          getMovie(id),
          getMovieCredits(id).catch(() => null),
          getStreamingProviders(id).catch(() => null),
          getMovieVideos(id).catch(() => null),
          getSimilarMovies(id).catch(() => null),
        ]);

        setMovie(movieData);
        setCast(creditsData?.cast?.slice(0, 8) || []);

        const directorEntry = creditsData?.crew?.find((c) => c.job === 'Director');
        setDirector(directorEntry?.name || null);

        setProviders(providersData?.results?.US || null);

        const officialTrailer =
          videosData?.results?.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
          videosData?.results?.find((v) => v.site === 'YouTube') ||
          null;
        setTrailer(officialTrailer);

        setSimilar(similarData?.results?.filter((m) => m.poster_path).slice(0, 6) || []);
      } catch (err) {
        setError(err.message || 'Failed to load movie.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const buildWatchlistPayload = (isWatched = false) => ({
    tmdbMovieId: movie.id,
    title: movie.title,
    posterPath: movie.poster_path || null,
    runtime: movie.runtime || null,
    genres: movie.genres?.map((g) => g.name).join(',') || null,
    releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
    director: director || null,
    isWatched,
  });

  const handleAddToWatchlist = async () => {
    if (!movie || adding) return;
    setError('');
    setSuccess('');
    setAdding(true);
    try {
      await addToWatchlist(token, buildWatchlistPayload(false));
      setSuccess('Added to watchlist!');
    } catch (err) {
      setError(err.message || 'Failed to add to watchlist');
    } finally {
      setAdding(false);
    }
  };

  const handleAlreadySeen = async () => {
    if (!movie || addingAsSeen) return;
    setError('');
    setSuccess('');
    setAddingAsSeen(true);
    try {
      const data = await addToWatchlist(token, buildWatchlistPayload(true));
      setSuccess('Logged as watched!');
      setAddedItemId(data.id);
      setUndoVisible(true);
      setTimeout(() => setUndoVisible(false), UNDO_TIMEOUT_MS);
    } catch (err) {
      setError(err.message || 'Failed to add');
    } finally {
      setAddingAsSeen(false);
    }
  };

  const handlePredictRating = async () => {
    if (!movie || predicting) return;
    setPredicting(true);
    setPredictionError('');
    setPrediction(null);
    try {
      const result = await getAIRatingPrediction(token, {
        tmdbMovieId: movie.id,
        title: movie.title,
        genres: movie.genres?.map((g) => g.name).join(',') || null,
        director: director || null,
        overview: movie.overview || null,
        releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
      });
      setPrediction(result);
    } catch (err) {
      setPredictionError(err.message || 'Failed to generate prediction.');
    } finally {
      setPredicting(false);
    }
  };

  const handleUndo = async () => {
    if (!addedItemId) return;
    try {
      await deleteWatchlistItem(token, addedItemId);
      setSuccess('');
      setAddedItemId(null);
      setUndoVisible(false);
    } catch (err) {
      setError(err.message || 'Failed to undo');
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
  const hasProviders = streamingProviders.length > 0 || rentProviders.length > 0;
  const alreadyAdded = success.length > 0;
  const lastSearch = sessionStorage.getItem('queued_last_search');

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 reveal">
      {/* Trailer modal */}
      {showTrailer && trailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm" onClick={() => setShowTrailer(false)}>
          <div className="relative mx-4 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                title="Trailer"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <button type="button" onClick={() => setShowTrailer(false)} className="mt-4 rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:text-white">
              ✕ Close
            </button>
          </div>
        </div>
      )}

      <div
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl"
        style={
          movie.backdrop_path
            ? { backgroundImage: `url(${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-900/30" />
        <div className="relative">
          <Link to={lastSearch ? `/search?query=${encodeURIComponent(lastSearch)}` : '/search'} className="text-xs font-semibold text-red-300">← Back to search</Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl">
              {movie.poster_path ? (
                <img src={`${TMDB_IMAGE_BASE}/w500${movie.poster_path}`} alt={movie.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-80 items-center justify-center text-sm text-slate-400">No poster</div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl">
              <h1 className="text-3xl font-semibold text-slate-100">{movie.title}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                {movie.release_date && <span>{movie.release_date.split('-')[0]}</span>}
                {movie.runtime > 0 && <span>{movie.runtime} min</span>}
                {movie.vote_average > 0 && <span className="text-yellow-400">★ {movie.vote_average.toFixed(1)} / 10</span>}
                {director && <span className="text-slate-400">Dir. {director}</span>}
              </div>
              {movie.genres?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span key={genre.id} className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-200">{genre.name}</span>
                  ))}
                </div>
              )}
              <p className="mt-6 text-sm leading-relaxed text-slate-300">{movie.overview}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {trailer && (
                  <button type="button" onClick={() => setShowTrailer(true)} className="rounded-full border border-white/10 bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:text-white">
                    ▶ Watch Trailer
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddToWatchlist}
                  disabled={adding || alreadyAdded}
                  className={`rounded-full px-5 py-2 text-xs font-semibold text-white transition ${success === 'Added to watchlist!' ? 'bg-emerald-600' : 'bg-red-600 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50'}`}
                >
                  {adding ? 'Adding…' : success === 'Added to watchlist!' ? '✓ Added' : 'Add to Watchlist'}
                </button>
                <button
                  type="button"
                  onClick={handleAlreadySeen}
                  disabled={addingAsSeen || alreadyAdded}
                  className={`rounded-full border px-5 py-2 text-xs font-semibold transition ${success === 'Logged as watched!' ? 'border-emerald-500/50 bg-emerald-600/20 text-emerald-200' : 'border-white/10 bg-slate-800 text-slate-300 hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'}`}
                >
                  {addingAsSeen ? 'Logging…' : success === 'Logged as watched!' ? '✓ Logged' : 'Already seen it'}
                </button>
                {undoVisible && (
                  <button type="button" onClick={handleUndo} className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-5 py-2 text-xs font-semibold text-yellow-300 transition hover:bg-yellow-500/20">
                    Undo
                  </button>
                )}
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>

              {/* AI Rating Prediction */}
              <div className="mt-6 border-t border-white/5 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">What would you rate this?</p>
                    <p className="text-xs text-slate-600">AI prediction based on your taste</p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePredictRating}
                    disabled={predicting}
                    className="shrink-0 rounded-full border border-purple-500/30 bg-purple-600/10 px-4 py-1.5 text-xs font-semibold text-purple-300 transition hover:bg-purple-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {predicting ? 'Predicting…' : prediction ? 'Retry' : 'Predict'}
                  </button>
                </div>
                {predictionError && (
                  <p className="mt-2 text-xs text-red-400">{predictionError}</p>
                )}
                {prediction && (
                  <div className="mt-3 rounded-2xl border border-purple-500/20 bg-purple-950/20 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-purple-300">
                        {prediction.predicted}
                        <span className="text-lg text-slate-500">/10</span>
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        prediction.confidence === 'high'
                          ? 'border-emerald-500/30 bg-emerald-600/10 text-emerald-400'
                          : prediction.confidence === 'low'
                          ? 'border-yellow-500/30 bg-yellow-600/10 text-yellow-400'
                          : 'border-slate-500/30 bg-slate-600/10 text-slate-400'
                      }`}>
                        {prediction.confidence} confidence
                      </span>
                    </div>
                    <p className="mt-2 text-xs italic leading-relaxed text-slate-400">
                      "{prediction.reasoning}"
                    </p>
                  </div>
                )}
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
                      <img src={`${TMDB_IMAGE_BASE}/w92${p.logo_path}`} alt={p.provider_name} className="h-12 w-12 rounded-xl border border-white/10 object-cover" />
                      <span className="text-xs text-slate-400">{p.provider_name}</span>
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
                      <img src={`${TMDB_IMAGE_BASE}/w92${p.logo_path}`} alt={p.provider_name} className="h-12 w-12 rounded-xl border border-white/10 object-cover opacity-80" />
                      <span className="text-xs text-slate-400">{p.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {providers?.link && (
              <a href={providers.link} target="_blank" rel="noopener noreferrer" className="inline-flex text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline">
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
                    <img src={`${TMDB_IMAGE_BASE}/w185${person.profile_path}`} alt={person.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-600 text-lg">?</div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold leading-tight text-slate-200">{person.name}</p>
                  {person.character && <p className="mt-0.5 text-xs leading-tight text-slate-500">{person.character}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar movies */}
      {similar.length > 0 && (
        <div className="mt-10 reveal">
          <h2 className="text-lg font-semibold text-slate-100">You might also like</h2>
          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {similar.map((m) => (
              <Link key={m.id} to={`/movies/${m.id}`} className="group flex flex-col gap-2">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-800">
                  <img src={`${TMDB_IMAGE_BASE}/w300${m.poster_path}`} alt={m.title} className="h-32 w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <p className="text-xs font-semibold leading-tight text-slate-300 group-hover:text-red-300">{m.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
