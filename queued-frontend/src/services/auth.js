import { apiFetch } from './api';

export const loginUser = (email, password) =>
  apiFetch('/auth/login', { method: 'POST', body: { email, password } });

export const registerUser = (email, username, password) =>
  apiFetch('/auth/register', { method: 'POST', body: { email, username, password } });
