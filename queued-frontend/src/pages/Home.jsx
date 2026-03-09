import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import API_BASE_URL from '../config';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/movies/trending`);
        const data = await res.json();
        setTrending(data.results?.slice(0, 6) || []);
      } catch {
        // fail silently — trending is non-critical
      } finally {
        setTrendingLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <section id="home" className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 reveal">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 p-10 shadow-2xl reveal">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300/80">
            Your life in film
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-100 sm:text-5xl">
            Welcome to <span className="text-red-400">Queued</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-300">
            Discover movies, build a watchlist, and keep track of what you have
            seen — all in a dark, cinematic workspace inspired by modern film
            communities.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Log in to start
              </Link>
            ) : (
              <>
                <Link
                  to="/search"
                  className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                >
                  Search movies
                </Link>
                <Link
                  to="/watchlist"
                  className="rounded-full border border-white/10 bg-slate-900/70 px-6 py-2 text-sm font-semibold text-slate-100 transition hover:border-red-500/40 hover:text-red-200"
                >
                  View watchlist
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3 reveal">
        {[
          {
            title: 'Tell us what you want to watch',
            body: 'Search the catalog and add films to your queue with one click.'
          },
          {
            title: 'Track what you have watched',
            body: 'Mark titles as watched and leave a rating when you finish.'
          },
          {
            title: 'Build your personal queue',
            body: 'Everything you care about lives in one clean watchlist.'
          }
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-slate-100">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{card.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 reveal">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Trending this week</h2>
            <p className="mt-1 text-sm text-slate-400">
              What the world is watching right now.
            </p>
          </div>
          {isAuthenticated && (
            <Link
              to="/search"
              className="text-xs font-semibold text-red-400 transition hover:text-red-300"
            >
              Search all →
            </Link>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {trendingLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skel-${i}`}
                className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70"
              >
                <div className="h-48 w-full bg-slate-800" />
                <div className="p-3">
                  <div className="h-3 w-3/4 rounded bg-slate-800" />
                </div>
              </div>
            ))}

          {!trendingLoading &&
            trending.map((movie) => (
              <Link
                key={movie.id}
                to={isAuthenticated ? `/movies/${movie.id}` : '/login'}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-lg transition hover:border-red-500/30 hover:shadow-red-900/20"
              >
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-800 text-xs text-slate-500">
                    No image
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-100 leading-snug">{movie.title}</p>
                  {movie.vote_average > 0 && (
                    <p className="mt-1 text-[10px] text-yellow-400">
                      ★ {movie.vote_average.toFixed(1)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
