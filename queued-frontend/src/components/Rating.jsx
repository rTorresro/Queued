export default function Rating({ value, onChange, onSave, disabled }) {
  const numericValue = Number(value || 0);
  const filledStars = Math.round(numericValue / 2);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= filledStars;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star * 2)}
              disabled={disabled}
              className={`text-lg transition ${
                isFilled ? 'text-yellow-400' : 'text-slate-500'
              }`}
              aria-label={`Rate ${star} stars`}
            >
              ★
            </button>
          );
        })}
      </div>
      <span className="text-xs text-slate-400">
        {numericValue ? `${numericValue}/10` : 'Not rated'}
      </span>
      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:border-red-500/40 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Save Rating
      </button>
    </div>
  );
}
