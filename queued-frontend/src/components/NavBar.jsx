import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    navigate(`/search?query=${encodeURIComponent(trimmed)}`);
    setSearchTerm('');
  };

  return (
    <div className="mx-auto mt-6 flex max-w-6xl items-center justify-between gap-6 rounded-2xl border border-white/10 bg-slate-950/90 px-7 py-4 shadow-2xl">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-extrabold text-red-400">
          Queued
        </Link>
        <ul className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-100">
        <li>
          <Link className="cursor-pointer rounded-full px-3 py-1 transition hover:bg-red-600/20" to="/">
            Home
          </Link>
        </li>
        {!isAuthenticated && (
          <li>
            <Link className="cursor-pointer rounded-full px-3 py-1 transition hover:bg-red-600/20" to="/login">
              Login
            </Link>
          </li>
        )}
        {isAuthenticated && (
          <>
            <li>
              <Link className="cursor-pointer rounded-full px-3 py-1 transition hover:bg-red-600/20" to="/search">
                Search
              </Link>
            </li>
            <li>
              <Link className="cursor-pointer rounded-full px-3 py-1 transition hover:bg-red-600/20" to="/watchlist">
                Watchlist
              </Link>
            </li>
            <li>
              <Link className="cursor-pointer rounded-full px-3 py-1 transition hover:bg-red-600/20" to="/profile">
                Profile
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full px-3 py-1 text-sm font-semibold text-slate-100 transition hover:bg-red-600/20"
              >
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
      </div>

      {isAuthenticated && (
        <form onSubmit={handleSearchSubmit} className="min-w-[220px]">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 rounded-full border border-white/10 bg-slate-900/80 px-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-red-500/70 focus:outline-none focus:ring-4 focus:ring-red-500/20"
          />
        </form>
      )}
    </div>
  );
};

export default Navbar;