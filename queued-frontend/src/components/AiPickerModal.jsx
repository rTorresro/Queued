import { useState } from 'react';
import { MOODS } from '../utils/constants';

const RUNTIME_OPTIONS = [
  { label: 'Any length', value: 'any' },
  { label: 'Under 90m', value: 'short' },
  { label: '90–120m', value: 'medium' },
  { label: 'Over 2h', value: 'long' },
];

export default function AiPickerModal({ onClose, onPick }) {
  const [mood, setMood] = useState('');
  const [runtime, setRuntime] = useState('any');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePick = async () => {
    setError('');
    setLoading(true);
    try {
      await onPick({ mood: mood || null, runtime });
    } catch (err) {
      setError(err.message || 'Failed to get a pick. Try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300/80">
          AI pick
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-100">What are you in the mood for?</h2>
        <p className="mt-1 text-xs text-slate-500">
          Claude will pick the perfect movie from your unwatched list.
        </p>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Your mood (optional)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(mood === m.value ? '' : m.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  mood === m.value
                    ? 'border-purple-500/50 bg-purple-600/20 text-purple-300'
                    : 'border-white/10 bg-slate-800 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Time available
          </p>
          <div className="flex flex-wrap gap-1.5">
            {RUNTIME_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRuntime(r.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  runtime === r.value
                    ? 'border-red-500/50 bg-red-600/10 text-red-300'
                    : 'border-white/10 bg-slate-800 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handlePick}
            disabled={loading}
            className="flex-1 rounded-full bg-red-600 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Picking…' : 'Pick for me'}
          </button>
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
  );
}
