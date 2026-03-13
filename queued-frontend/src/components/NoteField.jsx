import { useEffect, useRef, useState } from 'react';
import { SAVED_FEEDBACK_MS } from '../utils/constants';

export default function NoteField({ item, onSaveNote }) {
  const [note, setNote] = useState(item.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const save = async (value) => {
    if (value === (item.notes || '')) return;
    setSaving(true);
    await onSaveNote(item, value);
    setSaving(false);
    setSaved(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), SAVED_FEEDBACK_MS);
  };

  return (
    <div className="mt-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        placeholder="Add a quick note…"
        rows={2}
        className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:border-red-500/40 focus:outline-none"
      />
      {saving && <p className="mt-1 text-[10px] text-slate-500">Saving…</p>}
      {saved && <p className="mt-1 text-[10px] text-emerald-400">✓ Saved</p>}
    </div>
  );
}
