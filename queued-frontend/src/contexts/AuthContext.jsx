import { createContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('queued_token') || '';
  });

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('queued_token', newToken);
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('queued_token');
  };

  const value = useMemo(
    () => ({
      token,
      login,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider };