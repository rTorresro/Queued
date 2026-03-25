import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { loginUser, registerUser } from '../services/auth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccess('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'register') {
      if (!username.trim()) {
        setError('Username is required.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const data = await loginUser(email, password);
        login(data.token);
        navigate('/dashboard');
      } else {
        await registerUser(email, username, password);
        // Auto-login after register
        try {
          const loginData = await loginUser(email, password);
          login(loginData.token);
          navigate('/dashboard');
        } catch {
          setSuccess('Account created! You can now log in.');
          switchMode('login');
        }
      }
    } catch (err) {
      setError(err.message || 'Could not reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-4 reveal">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-red-400">Queued</h1>
        <p className="mt-2 text-sm text-slate-400">Your personal movie tracker</p>
      </div>

      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl">
        {/* Tab switcher */}
        <div className="flex border-b border-white/10">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 py-4 text-sm font-semibold transition ${
                mode === m
                  ? 'border-b-2 border-red-500 text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {m === 'login' ? 'Log in' : 'Create account'}
            </button>
          ))}
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-red-500/60 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-red-500/60 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-red-500/60 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-red-500/60 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-emerald-400">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? mode === 'login' ? 'Logging in…' : 'Creating account…'
                : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
