import { apiFetch } from './api';

export const getWatchlist = (token) =>
  apiFetch('/watchlist', { token });

export const addToWatchlist = (token, movieData) =>
  apiFetch('/watchlist', { method: 'POST', body: movieData, token });

export const updateWatchlistItem = (token, id, data) =>
  apiFetch(`/watchlist/${id}`, { method: 'PATCH', body: data, token });

export const deleteWatchlistItem = (token, id) =>
  apiFetch(`/watchlist/${id}`, { method: 'DELETE', token });
