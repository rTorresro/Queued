import { apiFetch } from './api';

export const searchMovies = (query) =>
  apiFetch(`/movies/search?query=${encodeURIComponent(query)}`);

export const getMovie = (id) =>
  apiFetch(`/movies/${id}`);

export const getMovieCredits = (id) =>
  apiFetch(`/movies/${id}/credits`);

export const getMovieVideos = (id) =>
  apiFetch(`/movies/${id}/videos`);

export const getSimilarMovies = (id) =>
  apiFetch(`/movies/${id}/similar`);

export const getStreamingProviders = (id) =>
  apiFetch(`/movies/${id}/providers`);

export const getTrendingMovies = () =>
  apiFetch('/movies/trending');

export const getAIRecommendations = (token) =>
  apiFetch('/recommendations/ai', { method: 'POST', token });

export const getAIPersonality = (token) =>
  apiFetch('/recommendations/personality', { method: 'POST', token });

export const getAIMoodPick = (token, { mood, runtime }) =>
  apiFetch('/recommendations/pick', { method: 'POST', body: { mood, runtime }, token });
