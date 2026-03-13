import { MOODS } from '../utils/constants';

export default function MoodPicker({ item, onMoodUpdate }) {
  return (
    <div className="mt-2">
      <p className="mb-1.5 text-[10px] uppercase tracking-widest text-slate-500">Mood when watched</p>
      <div className="flex flex-wrap gap-1.5">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onMoodUpdate(item, item.mood === m.value ? null : m.value)}
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide transition ${
              item.mood === m.value
                ? 'border-purple-500/50 bg-purple-600/20 text-purple-300'
                : 'border-white/10 bg-slate-900/70 text-slate-400 hover:border-white/20 hover:text-slate-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
