import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Watchlist from './pages/Watchlist';
import MovieDetails from './pages/MovieDetails';
import Profile from './pages/Profile';
import Diary from './pages/Diary';
import DirectorDeepDive from './pages/DirectorDeepDive';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/NavBar';

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    const intersectionObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            intersectionObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const observeRevealElements = () => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
        intersectionObs.observe(el);
      });
    };

    observeRevealElements();

    const mutationObs = new MutationObserver(observeRevealElements);
    mutationObs.observe(document.body, { childList: true, subtree: true });

    return () => {
      intersectionObs.disconnect();
      mutationObs.disconnect();
    };
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
        <Route path="/movies/:id" element={<ProtectedRoute><MovieDetails /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
        <Route path="/director/:name" element={<ProtectedRoute><DirectorDeepDive /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
