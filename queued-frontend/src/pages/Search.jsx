import { useState } from 'react';

export default function Search() {
  const [query, setQuery] = useState('');

  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');

    try {
        const res = await fetch(
            `http://localhost:5001/movies/search?query=${encodeURIComponent(query)}`
          );
          const data = await res.json();
    

        if (!res.ok) {
            setError(data?.error || 'Search failed');
            return; 
        }

        setResults(data.results || []);
    } catch (err) {
        setError('Network error');
    }
  };



  return (
    <section id="search">
      <div>This is the Search page</div>
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies..."
        />
        <button type="submit">Search</button>
      </form>
      {error && <p>{error}</p>}
      <div>
        {results.map((movie) => (
            <div key={movie.id}>
                <p>{movie.title}</p>
                {movie.poster_path && (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                    />
                )}
            </div>
        ))}
      </div>
    </section>
  );
}

