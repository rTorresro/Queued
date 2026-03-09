import { useState } from 'react';

export default function Rating({ value, onRate, disabled }) {
  const numericValue = Number(value || 0);
  const filledStars = Math.round(numericValue / 2);
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleClick = async (star) => {
    if (disabled || saving) return;
    setSaving(true);
    setSaved(false);
    await onRate(star * 2);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const displayStars = hovered || filledStars;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            disabled={disabled || saving}
            className={`text-xl transition-transform hover:scale-125 disabled:cursor-not-allowed ${
              star <= displayStars ? 'text-yellow-400' : 'text-slate-600'
            }`}
            aria-label={`Rate ${star} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="min-w-[60px] text-xs text-slate-400">
        {saving ? 'Saving…' : saved ? '✓ Saved' : numericValue ? `${numericValue}/10` : 'Not rated'}
      </span>
    </div>
  );
}
