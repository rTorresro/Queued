import { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import API_BASE_URL from '../config';

export default function Profile() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          setError(data?.error || 'Failed to load stats');
          return;
        }

        setItems(data || []);
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [token]);

  const stats = useMemo(() => {
    const total = items.length;
    const watched = items.filter((item) => item.is_watched).length;
    const rated = items.filter((item) => item.rating !== null).length;
    const avgRating = rated
      ? (
          items.reduce((sum, item) => sum + (item.rating || 0), 0) / rated
        ).toFixed(1)
      : '—';

    const topRated = [...items]
      .filter((item) => item.rating !== null)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);

    return { total, watched, rated, avgRating, topRated };
  }, [items]);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 reveal">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-10 shadow-2xl reveal">
        <h1 className="text-3xl font-semibold text-slate-100">Profile + Stats</h1>
        <p className="mt-2 text-sm text-slate-400">
          Track your watchlist progress and ratings over time.
        </p>

        {loading && <p className="mt-6 text-sm text-slate-400">Loading...</p>}
        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total in watchlist', value: stats.total },
                { label: 'Watched', value: stats.watched },
                { label: 'Rated', value: stats.rated },
                { label: 'Average rating', value: stats.avgRating }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-100">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-lg font-semibold text-slate-100">Top rated</h2>
              <div className="mt-4 space-y-3">
                {stats.topRated.length === 0 && (
                  <p className="text-sm text-slate-400">No ratings yet.</p>
                )}
                {stats.topRated.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <p className="text-sm text-slate-200">{item.title}</p>
                    <span className="text-sm text-yellow-400">{item.rating}/10</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
