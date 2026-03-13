import { useState } from 'react';

export default function MonthlyGoal({ items }) {
  const [goal, setGoal] = useState(() =>
    parseInt(localStorage.getItem('queued_monthly_goal') || '0')
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const now = new Date();
  const watchedThisMonth = items.filter((i) => {
    if (!i.is_watched || !i.added_at) return false;
    const d = new Date(i.added_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const pct = goal > 0 ? Math.min(100, Math.round((watchedThisMonth / goal) * 100)) : 0;
  const monthName = now.toLocaleString('default', { month: 'long' });

  const save = () => {
    const val = parseInt(draft);
    if (!isNaN(val) && val > 0) {
      setGoal(val);
      localStorage.setItem('queued_monthly_goal', String(val));
    }
    setEditing(false);
  };

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 reveal">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{monthName} goal</p>
          {goal === 0 ? (
            <p className="mt-1 text-sm text-slate-400">No goal set yet.</p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {watchedThisMonth} <span className="text-slate-500">/ {goal} movies</span>
            </p>
          )}
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="99"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              autoFocus
              className="w-16 rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-center text-sm text-slate-100 focus:border-red-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={save}
              className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-500"
            >
              Set
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(goal > 0 ? String(goal) : ''); setEditing(true); }}
            className="rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
          >
            {goal > 0 ? 'Edit goal' : 'Set goal'}
          </button>
        )}
      </div>
      {goal > 0 && (
        <>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500/80' : 'bg-red-500/70'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-600">
            {pct >= 100 ? 'Goal reached.' : `${goal - watchedThisMonth} more to go`}
          </p>
        </>
      )}
    </div>
  );
}
