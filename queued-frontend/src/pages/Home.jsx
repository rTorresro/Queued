import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const featured = [
    {
      title: 'Dune: Part Two',
      poster: '/pYwCTC2XvbvG52wYx0BZdF1s2LG.jpg'
    },
    {
      title: 'Oppenheimer',
      poster: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'
    },
    {
      title: 'Spider-Man: Across the Spider-Verse',
      poster: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg'
    },
    {
      title: 'The Batman',
      poster: '/74xTEgt7R36Fpooo50r9T25onhq.jpg'
    },
    {
      title: 'Interstellar',
      poster: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
    },
    {
      title: 'Barbie',
      poster: '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg'
    }
  ];

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
        <h2 className="text-xl font-semibold text-slate-100">Start with something popular</h2>
        <p className="mt-2 text-sm text-slate-400">
          A few posters to set the vibe — click through Search to add your own.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {featured.map((movie) => (
            <div
              key={movie.title}
              className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-lg"
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
                alt={movie.title}
                className="h-48 w-full object-cover"
              />
              <div className="p-3 text-xs font-semibold text-slate-100">
                {movie.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}