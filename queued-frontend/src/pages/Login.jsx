import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const API_BASE_URL = 'http://localhost:5001';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Login failed.');
        return;
      }

      login(data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Login failed. Check your backend and try again.');
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 gap-6">        
    <h1 className="mb-6 text-6xl font-extrabold text-center text-red-400">Queued</h1>
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl">  
            <h1 className="text-center">Login</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <label>
                Email
                <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                </label>
                <label>
                Password
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                </label>
                <button type="submit">Log in</button>
            </form>
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
    </section>
  );
}