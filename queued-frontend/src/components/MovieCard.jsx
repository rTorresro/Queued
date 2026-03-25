import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const MovieCard = ({ title, posterPath, description, actions, children, tmdbId, badge }) => {
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});
  const [glowColor, setGlowColor] = useState('rgba(var(--primary-rgb), 0.35)');
  const posterContent = posterPath ? (
    <img
      src={`https://image.tmdb.org/t/p/w500${posterPath}`}
      alt={title}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
      No image
    </div>
  );

  useEffect(() => {
    if (!posterPath) return;
    const img = new Image();
    img.src = `https://image.tmdb.org/t/p/w500${posterPath}`;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        const size = 12;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        const total = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        r = Math.round(r / total);
        g = Math.round(g / total);
        b = Math.round(b / total);
        setGlowColor(`rgba(${r}, ${g}, ${b}, 0.35)`);
      } catch {
        // Canvas tainted (cross-origin) — keep default glow color
      }
    };
  }, [posterPath]);

  const handleMouseMove = (event) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateX = ((y - midY) / midY) * -6;
    const rotateY = ((x - midX) / midX) * 6;
    setTiltStyle({
      transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ transform: 'perspective(900px) rotateX(0deg) rotateY(0deg)' });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...tiltStyle,
        boxShadow: `0 24px 60px ${glowColor}`,
        transition: 'transform 120ms ease, box-shadow 220ms ease'
      }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-xl transition hover:-translate-y-1 hover:border-red-500/30 hover:shadow-2xl"
    >
      <div className="relative h-60 w-full overflow-hidden bg-slate-800">
        {tmdbId ? (
          <Link to={`/movies/${tmdbId}`} className="block h-full w-full">
            {posterContent}
          </Link>
        ) : (
          posterContent
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-slate-950/70" />
        {badge && (
          <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
            {badge}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        {tmdbId ? (
          <Link to={`/movies/${tmdbId}`} className="text-lg font-semibold text-slate-100">
            {title}
          </Link>
        ) : (
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        )}
        {description && (
          <details className="text-sm text-slate-300">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-red-300/80">
              Description
            </summary>
            <p className="mt-2 text-sm text-slate-300">{description}</p>
          </details>
        )}
        {children && <div className="text-sm text-slate-300">{children}</div>}
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default MovieCard;
