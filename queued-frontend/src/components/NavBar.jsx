import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    navigate(`/search?query=${encodeURIComponent(trimmed)}`);
    setSearchTerm('');
    setMenuOpen(false);
  };

  const linkClass = (path) => {
    const active = location.pathname === path;
    return `cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold transition ${
      active ? 'bg-red-600/25 text-red-300' : 'text-slate-100 hover:bg-red-600/20'
    }`;
  };

  const navLinks = isAuthenticated ? (
    <>
      <Link className={linkClass('/dashboard')} to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
      <Link className={linkClass('/search')} to="/search" onClick={() => setMenuOpen(false)}>Search</Link>
      <Link className={linkClass('/watchlist')} to="/watchlist" onClick={() => setMenuOpen(false)}>Watchlist</Link>
      <Link className={linkClass('/diary')} to="/diary" onClick={() => setMenuOpen(false)}>Diary</Link>
      <Link className={linkClass('/profile')} to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
      <button
        type="button"
        onClick={handleLogout}
        className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold text-slate-400 transition hover:bg-red-600/20 hover:text-slate-100"
      >
        Logout
      </button>
    </>
  ) : (
    <>
      <Link className={linkClass('/')} to="/" onClick={() => setMenuOpen(false)}>Home</Link>
      <Link className={linkClass('/login')} to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
    </>
  );

  return (
    <div className="mx-auto mt-4 max-w-6xl px-4 sm:px-6">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/90 px-5 py-3 shadow-2xl">
        {/* Logo */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="text-xl font-extrabold text-red-400 shrink-0"
        >
          Queued
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks}
        </ul>

        {/* Desktop search */}
        {isAuthenticated && (
          <form onSubmit={handleSearchSubmit} className="hidden md:block">
            <input
              type="text"
              placeholder="Quick search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-48 rounded-full border border-white/10 bg-slate-900/80 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500/70 focus:outline-none focus:ring-4 focus:ring-red-500/20"
            />
          </form>
        )}

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg border border-white/10 bg-slate-900/70"
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-5 bg-slate-300 transition-all duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-5 bg-slate-300 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-slate-300 transition-all duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-2 rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-4 shadow-2xl">
          <div className="flex flex-col gap-1">
            {navLinks}
          </div>
          {isAuthenticated && (
            <form onSubmit={handleSearchSubmit} className="mt-3">
              <input
                type="text"
                placeholder="Quick search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-full border border-white/10 bg-slate-900/80 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500/70 focus:outline-none"
              />
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
