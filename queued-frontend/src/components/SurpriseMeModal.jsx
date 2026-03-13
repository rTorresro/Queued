import { Link } from 'react-router-dom';
import { TMDB_IMAGE_BASE } from '../utils/constants';

export default function SurpriseMeModal({ item, reason, onClose, onMarkWatched }) {
  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {item.poster_path && (
          <img
            src={`${TMDB_IMAGE_BASE}/w500${item.poster_path}`}
            alt={item.title}
            className="h-56 w-full object-cover"
          />
        )}
        <div className="p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-red-300/80">
            {reason ? 'Picked for you' : "Tonight's pick"}
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-100">{item.title}</h2>
          {item.release_year && <p className="mt-1 text-xs text-slate-500">{item.release_year}</p>}
          {item.runtime && <p className="text-xs text-slate-500">{item.runtime} min</p>}
          {item.genres && (
            <p className="mt-2 text-xs text-slate-400">{item.genres.split(',').join(' · ')}</p>
          )}
          {reason && (
            <p className="mt-3 text-sm italic leading-relaxed text-slate-300">"{reason}"</p>
          )}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => { onMarkWatched(item); onClose(); }}
              className="flex-1 rounded-full bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
            >
              Mark watched
            </button>
            <Link
              to={`/movies/${item.tmdb_movie_id}`}
              className="flex-1 rounded-full border border-white/10 bg-slate-800 py-2 text-center text-xs font-semibold text-slate-200 transition hover:border-white/20"
              onClick={onClose}
            >
              Details
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
