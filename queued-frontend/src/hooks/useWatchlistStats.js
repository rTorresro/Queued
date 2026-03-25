import { useMemo } from 'react';
import { MOODS } from '../utils/constants';

export default function useWatchlistStats(items) {
  return useMemo(() => {
    const total = items.length;
    const watchedItems = items.filter((i) => i.is_watched);
    const watched = watchedItems.length;
    const rated = items.filter((i) => i.rating !== null).length;
    const avgRating = rated
      ? (items.reduce((sum, i) => sum + (i.rating || 0), 0) / rated).toFixed(1)
      : '—';

    const totalMinutes = items
      .filter((i) => i.is_watched && i.runtime)
      .reduce((sum, i) => sum + i.runtime, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const genreCounts = {};
    items
      .filter((i) => i.is_watched && i.genres)
      .forEach((i) => {
        i.genres.split(',').forEach((g) => {
          const genre = g.trim();
          if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const maxGenreCount = topGenres[0]?.[1] || 1;

    const decadeCounts = {};
    items
      .filter((i) => i.is_watched && i.release_year)
      .forEach((i) => {
        const decade = Math.floor(i.release_year / 10) * 10;
        decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
      });
    const decades = Object.entries(decadeCounts).sort((a, b) => Number(a[0]) - Number(b[0]));
    const maxDecadeCount = Math.max(...decades.map(([, c]) => c), 1);

    const directorCounts = {};
    items
      .filter((i) => i.is_watched && i.director)
      .forEach((i) => {
        directorCounts[i.director] = (directorCounts[i.director] || 0) + 1;
      });
    const topDirectors = Object.entries(directorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const currentYear = new Date().getFullYear();
    const thisYear = items.filter((i) => {
      if (!i.is_watched) return false;
      return new Date(i.watched_at || i.added_at).getFullYear() === currentYear;
    });
    const yearMovies = thisYear.length;
    const yearMinutes = thisYear.filter((i) => i.runtime).reduce((s, i) => s + i.runtime, 0);
    const yearHours = Math.floor(yearMinutes / 60);
    const yearGenreCounts = {};
    thisYear.filter((i) => i.genres).forEach((i) => {
      i.genres.split(',').forEach((g) => {
        const genre = g.trim();
        if (genre) yearGenreCounts[genre] = (yearGenreCounts[genre] || 0) + 1;
      });
    });
    const yearTopGenre =
      Object.entries(yearGenreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const yearBest =
      thisYear.filter((i) => i.rating).sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] ||
      null;

    const topRated = [...items]
      .filter((i) => i.rating !== null)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    const distribution = [2, 4, 6, 8, 10].map((score) => ({
      label: `${score / 2}★`,
      score,
      count: items.filter((i) => i.rating === score).length,
    }));
    const maxCount = Math.max(...distribution.map((d) => d.count), 1);

    const moodStats = MOODS.map(({ value, label }) => {
      const moodItems = watchedItems.filter((i) => i.mood === value);
      const ratedMoodItems = moodItems.filter((i) => i.rating !== null);
      const avgMoodRating = ratedMoodItems.length
        ? ratedMoodItems.reduce((s, i) => s + (i.rating || 0), 0) / ratedMoodItems.length
        : null;
      return { value, label, count: moodItems.length, avgRating: avgMoodRating };
    }).filter((m) => m.count > 0);

    const moodInsight = (() => {
      const withRatings = moodStats.filter((m) => m.avgRating !== null && m.count >= 2);
      if (withRatings.length < 2) return null;
      const best = withRatings.reduce((a, b) => (a.avgRating > b.avgRating ? a : b));
      const worst = withRatings.reduce((a, b) => (a.avgRating < b.avgRating ? a : b));
      const diff = (best.avgRating - worst.avgRating).toFixed(1);
      if (diff < 1) return null;
      return `You rate movies ${diff} points higher when ${best.label} vs ${worst.label}.`;
    })();

    return {
      total, watched, rated, avgRating,
      hours, minutes,
      topGenres, maxGenreCount,
      decades, maxDecadeCount,
      topDirectors,
      topRated, distribution, maxCount,
      yearMovies, yearHours, yearTopGenre, yearBest, currentYear,
      moodStats, moodInsight,
    };
  }, [items]);
}
